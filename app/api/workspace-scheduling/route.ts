import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { schedulingInput } from '../../lib/workspaceScheduling';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
async function handle(request:Request){
 try{
  if(request.method!=='GET'){
   if(request.headers.get('origin')!==new URL(request.url).origin)return reply({error:'Request origin not allowed.'},403);
   if(request.headers.get('content-type')?.split(';')[0]!=='application/json')return reply({error:'JSON required.'},415);
  }
  const cookieStore=cookies();const db=createRouteHandlerClient({cookies:()=>cookieStore});
  const {data:{user},error}=await db.auth.getUser();if(error||!user)return reply({error:'Sign in required. Drafts have not been submitted.'},401);
  if(request.method==='GET'){
   const queries=[['availability','id,title,timezone,weekday,start_minute,end_minute,duration,buffer,notice_hours,horizon_days,daily_cap,active,version,recurrence'],['intakes','id,title,consent,fields,version'],['bookings','id,attendee,starts_at,ends_at,timezone,status,version,intake_id,answers']];
   const result:Record<string,unknown>={actorId:user.id,truncated:false};
   for(const [name,columns]of queries){const {data,error}=await db.from('workspace_scheduling_'+name).select(columns).eq('owner_id',user.id).order('created_at',{ascending:false}).order('id',{ascending:false}).limit(501);if(error)throw error;result[name]=(data||[]).slice(0,500);if((data||[]).length>500)result.truncated=true;}
   return reply(result);
  }
  let body:Record<string,unknown>;
  try{const raw=await request.text();if(raw.length>24000)return reply({error:'Request too large.'},413);body=schedulingInput(JSON.parse(raw));}catch(e){return reply({error:e instanceof Error?e.message:'Invalid request.'},400);}
  if(body.expectedActorId!==user.id)return reply({error:'Account changed. Sign back into the original account or reload to start a new draft.'},409);
  const {data,error:rpcError}=await db.rpc('workspace_scheduling_mutate',{payload:body});
  if(rpcError){if(['P0001','23503','23505','23514','22007','22023','22P02'].includes(rpcError.code))return reply({error:'Could not apply this change. Refresh records: the slot, version, answers, or availability may no longer be valid.'},409);throw rpcError;}
  return reply({record:data});
 }catch{return reply({error:'Scheduling unavailable. Your draft is preserved; retry the same action.'},503);}
}
export const GET=handle;
export const POST=handle;
