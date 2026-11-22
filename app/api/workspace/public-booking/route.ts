import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {createRouteHandlerClient} from '@supabase/auth-helpers-nextjs';
import {bookingConfigInput,boundedJson} from '../../../lib/publicBooking';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
async function handle(request:Request){
 if(request.method==='POST'){
  if(request.headers.get('origin')!==new URL(request.url).origin)return reply({error:'Request origin not allowed.'},403);
  if(request.headers.get('content-type')?.split(';')[0]!=='application/json')return reply({error:'JSON required.'},415);
 }
 try{
  const cookieStore=cookies(),db=createRouteHandlerClient({cookies:()=>cookieStore});
  const {data:{user},error}=await db.auth.getUser();if(error||!user)return reply({error:'Sign in required.'},401);
  if(request.method==='GET'){
   const result=await db.from('workspace_public_booking').select('token,availability_id,intake_id,enabled,version').eq('owner_id',user.id).maybeSingle();
   if(result.error)throw result.error;return reply({actorId:user.id,portal:result.data,available:process.env.PUBLIC_BOOKING_ENABLED==='true'});
  }
  let body;try{body=bookingConfigInput(await boundedJson(request,2048));}catch{return reply({error:'Invalid settings.'},400);}
  if(body.expectedActorId!==user.id)return reply({error:'Account changed. Reload before saving.'},409);
  if(body.enabled&&process.env.PUBLIC_BOOKING_ENABLED!=='true')return reply({error:'Public booking is not enabled on this deployment.'},503);
  const result=await db.rpc('public_booking_config',{payload:body});if(result.error)return reply({error:'Settings changed or selection unavailable. Reload and review before saving again.'},409);
  return reply({actorId:user.id,portal:result.data});
 }catch{return reply({error:'Booking settings unavailable.'},503);}
}
export const GET=handle;
export const POST=handle;
