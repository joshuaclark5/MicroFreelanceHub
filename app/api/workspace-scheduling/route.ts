import {businessTimezone} from '../../lib/businessTimezone';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { schedulingInput, validId, calendarMonthBounds } from '../../lib/workspaceScheduling';
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
   const params=new URL(request.url).searchParams;
   const focusKeys=['bookingId','availabilityId'];
   let calendar:null|ReturnType<typeof calendarMonthBounds>=null;
   if(params.has('calendarMonth')){
    if(Array.from(params.keys()).some(k=>k!=='calendarMonth')||params.getAll('calendarMonth').length!==1)return reply({error:'Choose one calendar month.'},400);
    try{calendar=calendarMonthBounds(params.get('calendarMonth'));}catch(e){return reply({error:(e as Error).message},400);}
   }
   if(!calendar&&(Array.from(params.keys()).some(k=>!focusKeys.includes(k))||focusKeys.some(k=>params.getAll(k).length>1)||focusKeys.filter(k=>params.has(k)).length>1||focusKeys.some(k=>params.has(k)&&!validId(params.get(k)))))return reply({error:'Choose one valid scheduling record.'},400);
   const queries=[['availability','id,title,timezone,weekday,start_minute,end_minute,duration,buffer,notice_hours,horizon_days,daily_cap,active,version,recurrence'],['intakes','id,title,consent,fields,version'],['bookings','id,attendee,starts_at,ends_at,timezone,status,version,intake_id,answers']];
   if(calendar){
    const {data:rules,error:rulesError}=await db.from('workspace_scheduling_availability').select(queries[0][1]).eq('owner_id',user.id).eq('active',true).order('id',{ascending:true}).limit(501);
    if(rulesError)throw rulesError;
    const {data:bookings,error:bookingsError}=await db.from('workspace_scheduling_bookings').select(queries[2][1]).eq('owner_id',user.id).gte('starts_at',calendar.start).lt('starts_at',calendar.end).order('starts_at',{ascending:true}).order('id',{ascending:true}).limit(501);
    if(bookingsError)throw bookingsError;
    return reply({actorId:user.id,calendarMonth:calendar.month,truncated:(rules||[]).length>500||(bookings||[]).length>500,availability:(rules||[]).slice(0,500),bookings:(bookings||[]).slice(0,500),intakes:[]});
   }
   const result:Record<string,unknown>={actorId:user.id,businessTimezone:businessTimezone(user.user_metadata?.mfh_workspace?.timezone),truncated:false};
   for(const [name,columns]of queries){const {data,error}=await db.from('workspace_scheduling_'+name).select(columns).eq('owner_id',user.id).order('created_at',{ascending:false}).order('id',{ascending:false}).limit(501);if(error)throw error;result[name]=(data||[]).slice(0,500);if((data||[]).length>500)result.truncated=true;}
   const focusKey=focusKeys.find(k=>params.has(k));
   if(focusKey){
    const name=focusKey==='bookingId'?'bookings':'availability',id=params.get(focusKey)!;
    const columns=queries.find(q=>q[0]===name)![1];
    const {data:focused,error:focusError}=await db.from('workspace_scheduling_'+name).select(columns).eq('owner_id',user.id).eq('id',id).limit(1);
    if(focusError)throw focusError;
    if(!focused?.length)return reply({error:'This record is unavailable in the signed-in account. No changes were made.'},404);
    result[name]=[focused[0],...(result[name] as {id:string}[]).filter(row=>row.id!==id)];
    const intakeId=(focused[0] as unknown as {intake_id?:unknown}).intake_id;
    if(name==='bookings'&&!validId(intakeId))throw Error('Invalid linked intake.');
    if(name==='bookings'&&validId(intakeId)&&!(result.intakes as {id:string}[]).some(row=>row.id===intakeId)){
     const {data:intake,error:intakeError}=await db.from('workspace_scheduling_intakes').select(queries[1][1]).eq('owner_id',user.id).eq('id',intakeId).limit(1);
     if(intakeError)throw intakeError;
     if(intake?.length)result.intakes=[intake[0],...(result.intakes as unknown[])];
    }
   }
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
