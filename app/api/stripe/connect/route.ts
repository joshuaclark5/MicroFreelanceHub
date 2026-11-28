import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {createRouteHandlerClient} from '@supabase/auth-helpers-nextjs';
import {connectConfig,connectState,connectAttempt} from '../../../lib/server/stripeConnect';
export const dynamic='force-dynamic';
export const runtime='nodejs';
const reply=(body:object,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}});
export async function POST(request:Request){
 try{
  const origin=new URL(request.url).origin;
  if(request.headers.get('origin')!==origin||!origin.startsWith('https://'))return reply({error:'Open Settings on this website to connect.'},403);
  const c=connectConfig();if(!c)return reply({error:'Stripe connection setup is not available on this deployment.'},503);
  const auth=createRouteHandlerClient({cookies});const u=await auth.auth.getUser();
  if(u.error||!u.data.user)return reply({error:'Sign in to connect your payment account.'},401);
  const state=connectState();
  if(!await connectAttempt('begin',u.data.user.id,state,origin))return reply({error:'A new connection cannot be started. Refresh your connection status; existing payment accounts are not replaced here.'},409);
  const target=new URL('https://connect.stripe.com/oauth/authorize');
  target.search=new URLSearchParams({response_type:'code',client_id:c.clientId,scope:'read_write',redirect_uri:origin+'/api/stripe/callback',state}).toString();
  return reply({url:target.toString()});
 }catch{return reply({error:'Connection setup could not be started. Try again from Settings.'},503);}
}
