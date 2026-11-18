import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { mutationInput, uuid } from '../../lib/workspaceInvoices';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
const tables:Record<string,string>={invoices:'workspace_invoice_drafts',schedules:'workspace_invoice_schedules',audit:'workspace_invoice_audit',entries:'workspace_invoice_allowance_entries',allowances:'workspace_invoice_allowances',clients:'workspace_clients',projects:'workspace_projects'};
export async function GET(request:Request){
 try{
 const db=createRouteHandlerClient({cookies:()=>cookies()});const {data:{user},error}=await db.auth.getUser();if(error||!user)return reply({error:'Sign in required.'},401);
 const url=new URL(request.url),kind=url.searchParams.get('kind')||'invoices',after=url.searchParams.get('after');if(!tables[kind]||(after&&!uuid(after)))return reply({error:'Invalid list request.'},400);
 const cols=kind==='clients'?'id,name,email':kind==='projects'?'id,name,client_id,status':'*';
 let q=db.from(tables[kind]).select(cols).eq('owner_id',user.id).order(kind==='allowances'?'currency':'id').limit(101);if(after&&kind!=='allowances')q=q.gt('id',after);
 const {data,error:readError}=await q;if(readError)throw readError;const records=data||[];return reply({actorId:user.id,records:records.slice(0,100),nextCursor:records.length>100?(records[99] as unknown as {id:string}).id:null});
 }catch{return reply({error:'Invoices unavailable. Retry without discarding your draft.'},503);}
}
export async function POST(request:Request){
 try{
 if(request.headers.get('origin')!==new URL(request.url).origin)return reply({error:'Request origin not allowed.'},403);
 if(request.headers.get('content-type')?.split(';')[0]!=='application/json')return reply({error:'JSON required.'},415);
 const db=createRouteHandlerClient({cookies:()=>cookies()});const {data:{user},error}=await db.auth.getUser();if(error||!user)return reply({error:'Sign in required. Your draft is preserved.'},401);
 let p:Record<string,unknown>;try{const raw=await request.text();if(raw.length>20000)return reply({error:'Request too large.'},413);p=mutationInput(JSON.parse(raw));}catch(e){return reply({error:(e as Error).message},400);}
 if(p.expectedActorId!==user.id)return reply({error:'Account changed. Your draft was not applied. Return to the original account or explicitly start a new draft.'},409);
 const {data,error:writeError}=await db.rpc('workspace_invoice_mutate',{p});if(writeError){const code=writeError.code;if(code==='P0002')return reply({error:'Record not found.'},404);if(['40001','23503','23505','23514','P0001','22P02','22008'].includes(code))return reply({error:'Conflict or invalid values. Refresh records, review the version, relationships, dates and allowance balance. Your draft is preserved.'},409);throw writeError;}
 return reply({record:data,actorId:user.id});
 }catch{return reply({error:'Save outcome unavailable. Retry the same operation; your draft is preserved.'},503);}
}
