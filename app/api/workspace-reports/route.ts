import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {createRouteHandlerClient} from '@supabase/auth-helpers-nextjs';
import {reportInput,reportTables,reportColumns,reportRow,reportCsv,summarizeReports,ReportRow} from '../../lib/workspaceReports';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff'};
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers});
export async function GET(request:Request){
 try{
  const db=createRouteHandlerClient({cookies:()=>cookies()});
  const {data:{user},error}=await db.auth.getUser();
  if(error||!user)return reply({error:'Sign in to read your reports.'},401);
  let p;try{p=reportInput(new URL(request.url).searchParams);}catch(e){return reply({error:(e as Error).message},400);}
  if(p.actor&&p.actor!==user.id)return reply({error:'Account changed. Reload this page to start a report for the current account.'},409);
  const readAt=new Date().toISOString();
  const page=async(after:string|null)=>{
   let q=db.from(reportTables[p.kind]).select(reportColumns[p.kind],{count:'exact'}).eq('owner_id',user.id).order('id',{ascending:true}).limit(100);
   if(p.kind==='time')q=q.gte('started_at',p.from+'T00:00:00Z').lt('started_at',p.end);
   // Invoice document dates are immutable after issue and identical to snapshot dates.
   else q=q.gte('document->>issueDate',p.from).lte('document->>issueDate',p.to);
   if(after)q=q.gt('id',after);
   const result=await q;if(result.error)throw Error('read');
   const raw=result.data;
   if(!Array.isArray(raw)||raw.length>100)throw Error('read');
   const records=raw.map(r=>reportRow(p.kind,r));
   if(records.some((r,i)=>r.id<=(i?records[i-1].id:after||'')))throw Error('unstable order');
   const count=Number.isSafeInteger(result.count)&&result.count!>=0?result.count:null;
   const proven=count!==null&&count>=records.length&&(count===0||records.length>0);
   const complete=proven&&count===records.length;
   return {records,count,proven,complete,nextCursor:proven&&!complete?records[records.length-1].id:null};
  };
  if(p.format==='csv'){
   const rows:ReportRow[]=[];let after:string|null=null,total:number|null=null;
   for(let n=0;n<100;n++){
    const part=await page(after);
    if(!part.proven||part.count===null)return reply({error:'Export unavailable: record count could not be verified. No partial file was created.'},409);
    if(total===null)total=part.count;
    if(total!==rows.length+part.count)return reply({error:'Records changed during export. Reload and try again.'},409);
    rows.push(...part.records);
    if(part.complete){
     // Recheck current identity before releasing the generated private download.
     const last=await db.auth.getUser();if(last.error||last.data.user?.id!==user.id)return reply({error:'Session changed. No file was created.'},409);
     return new Response(reportCsv(rows,p.kind,p.from,p.to,readAt),{headers:{...headers,'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="workspace-'+p.kind+'-'+p.from+'-'+p.to+'.csv"'}});
    }
    after=part.nextCursor;
   }
   return reply({error:'Export reached its 100-page read limit (at most 10,000 records). Narrow the dates; no partial file was created.'},409);
  }
  const part=await page(p.after);
  return reply({actorId:user.id,kind:p.kind,from:p.from,to:p.to,readAt,...part,groups:part.complete&&!p.after?summarizeReports(part.records):null,consistency:'Current records read in ID order, not a historical or transaction-isolated snapshot. Reload after edits.'});
 }catch{return reply({error:'Reports unavailable. No totals or export could be verified. Try loading again.'},503);}
}
