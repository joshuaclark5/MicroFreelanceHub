import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {createRouteHandlerClient} from '@supabase/auth-helpers-nextjs';
import {timeInput,timeRange,timeTotals,TimeEntry} from '../../lib/workspaceTime';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
export async function GET(request:Request){
 try{
 const cookieStore=cookies(),db=createRouteHandlerClient({cookies:()=>cookieStore});
 const {data:{user},error:authError}=await db.auth.getUser();
 if(authError||!user)return reply({error:'Sign in required. Your draft is preserved.'},401);
 let range;try{range=timeRange(new URL(request.url).searchParams);}catch(e){return reply({error:(e as Error).message},400);}
 let query=db.from('workspace_time_entries').select('*',{count:'exact'}).eq('owner_id',user.id).gte('started_at',range.from).lt('started_at',range.to).not('stopped_at','is',null).order('started_at',{ascending:false}).order('id').limit(1001);
 if(range.projectId)query=query.eq('project_id',range.projectId);
 if(range.billable!==null)query=query.eq('billable',range.billable==='true');
 const [entries,projects,running]=await Promise.all([query,db.from('workspace_projects').select('id,name,status',{count:'exact'}).eq('owner_id',user.id).order('name').limit(1001),db.from('workspace_time_entries').select('*').eq('owner_id',user.id).is('stopped_at',null).maybeSingle()]);
 if(entries.error||projects.error||running.error)throw Error('read');
 const truncated=entries.count===null||entries.count===undefined||entries.count>(entries.data||[]).length||entries.count>1000,rows=(entries.data||[]).slice(0,1000) as TimeEntry[];
 return reply({actorId:user.id,records:rows,projects:(projects.data||[]).slice(0,1000),projectsTruncated:projects.count===null||projects.count===undefined||projects.count>(projects.data||[]).length||projects.count>1000,running:running.data,serverNow:new Date().toISOString(),truncated,totals:truncated?null:timeTotals(rows),range});
 }catch{return reply({error:'Time workspace unavailable. Your draft is preserved; retry loading.'},503);}
}
export async function POST(request:Request){
 try{
 if(request.headers.get('origin')!==new URL(request.url).origin)return reply({error:'Request origin not allowed.'},403);
 if(request.headers.get('content-type')?.split(';')[0]!=='application/json')return reply({error:'JSON required.'},415);
 if(new URL(request.url).search)return reply({error:'Mutation query parameters are not supported.'},400);
 const cookieStore=cookies(),db=createRouteHandlerClient({cookies:()=>cookieStore});
 const {data:{user},error:authError}=await db.auth.getUser();
 if(authError||!user)return reply({error:'Sign in required. Your draft is preserved.'},401);
 let payload;try{const raw=await request.text();if(raw.length>12000)return reply({error:'Time entry is too large.'},413);payload=timeInput(JSON.parse(raw));}catch(e){return reply({error:e instanceof SyntaxError?'Invalid JSON.':(e as Error).message},400);}
 if(payload.expectedActorId!==user.id)return reply({error:'Account changed. Return to the original account to save this draft.'},409);
 const {data,error}=await db.rpc('workspace_time_mutate',{payload});
 if(error){
 if(error.code==='P0002')return reply({error:'Time entry not found.'},404);
 if(['40001','23505','23503'].includes(error.code))return reply({error:'Conflict: account, project, timer or entry changed. Reload saved time before retrying.'},409);
 if(['22023','22007','22008','22P02','23514','22003'].includes(error.code))return reply({error:'Check time details. Completed time must end in the past; duration is 1 second to 31 days.'},400);
 throw error;
 }
 return reply({actorId:user.id,record:data});
 }catch{return reply({error:'Save outcome is unconfirmed. Retry the same operation to recover it safely; your draft is preserved.'},503);}
}
