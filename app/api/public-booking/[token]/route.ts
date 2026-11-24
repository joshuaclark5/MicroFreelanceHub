import {NextResponse} from 'next/server';
import {boundedJson,publicBookingInput,publicBookingStart,validHandle} from '../../../lib/publicBooking';
import {publicBookingStore,bookingChallenge,verifyBookingChallenge,bookingIdentity} from '../../../lib/server/publicBooking';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow, noarchive','Referrer-Policy':'no-referrer',...(status===429?{'Retry-After':'3600'}:{})}});
async function handle(request:Request,{params}:{params:{token:string}}){
 const token=params.token;
 const writing=request.method==='POST';let startsOn:string|null=null;
 try{if(!validHandle(token)||writing&&new URL(request.url).search)throw Error('Invalid link');startsOn=publicBookingStart(new URL(request.url).searchParams);}catch{return reply({error:'Booking link unavailable.'},404);}
 if(writing&&request.headers.get('origin')!==new URL(request.url).origin)return reply({error:'Request origin not allowed.'},403);
 if(writing&&request.headers.get('content-type')?.split(';')[0]!=='application/json')return reply({error:'JSON required.'},415);
 let body:Record<string,unknown>|null=null;
 if(writing)try{body=publicBookingInput(await boundedJson(request));}catch{return reply({error:'Check your name, answers, consent and selected time.'},400);}
 try{
  const store=publicBookingStore();
  if(body&&!verifyBookingChallenge(store.key,token,body.challenge as string))return reply({error:'Reload available times and wait a moment before submitting.'},400);
  const limit=await store.rpc('public_booking_throttle',{handle:token,identity_hash:bookingIdentity(store.key,request),writing});
  if(limit.error)return reply({error:'Booking temporarily unavailable.'},503);
  if(limit.data!==true)return reply({error:'Link unavailable or request limit reached. Try again later.'},429);
  const payload=body?Object.fromEntries(Object.entries(body).filter(([k])=>!['challenge','website'].includes(k))):null;
  const result=writing?await store.rpc('public_booking_service',{handle:token,payload}):await store.rpc('public_booking_window',{handle:token,starts_on:startsOn});
  if(result.error)return reply({error:writing?'This time or booking form is no longer available. Reload available times.':'Booking link unavailable.'},writing?409:404);
  return reply(writing?result.data:{...result.data,challenge:bookingChallenge(store.key,token)});
 }catch{return reply({error:'Booking temporarily unavailable. If you submitted, retry the same request.'},503);}
}
export const GET=handle;
export const POST=handle;
