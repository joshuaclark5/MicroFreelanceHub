import {NextResponse} from 'next/server';
import Stripe from 'stripe';
import {cookies} from 'next/headers';
import {createRouteHandlerClient} from '@supabase/auth-helpers-nextjs';
import {connectConfig,connectAttempt} from '../../../lib/server/stripeConnect';
export const dynamic='force-dynamic';
export const runtime='nodejs';
const reply=(error:string,status:number)=>NextResponse.json({error},{status,headers:{'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}});
export async function GET(request:Request){
 try{
  const url=new URL(request.url),p=url.searchParams,state=p.get('state'),code=p.get('code');
  if([...p.keys()].some(k=>!['state','code','error','error_description','scope'].includes(k)||p.getAll(k).length!==1)||!state||! /^[A-Za-z0-9_-]{43}$/.test(state)||(!p.has('error')&&(!code||code.length>4096)))return reply('Invalid connection response. Return to Settings and start again.',400);
  const c=connectConfig();if(!c)return reply('Stripe connection setup is unavailable.',503);
  const auth=createRouteHandlerClient({cookies}),u=await auth.auth.getUser(),actor=u.data.user?.id;
  if(u.error||!actor)return reply('Sign in to the original account, then start again from Settings.',401);
  // Consume before exchange: actor, expiry, origin and replay are authoritative.
  if(!await connectAttempt('consume',actor,state,url.origin))return reply('This connection attempt expired or was already used. Start again from Settings.',409);
  if(p.has('error'))return reply('Stripe authorization was not completed. Your payment account was not changed. Return to Settings to try again.',400);
  const current=await auth.auth.getUser();if(current.error||current.data.user?.id!==actor)return reply('Account changed. Start again from Settings.',409);
  const stripe=new Stripe(c.secret),token=await stripe.oauth.token({grant_type:'authorization_code',code:code!});
  if(!token.stripe_user_id||token.livemode!==/^(sk|rk)_live_/.test(c.secret))return reply('Stripe returned an unexpected account mode. No payment account was saved.',409);
  const finalUser=await auth.auth.getUser();if(finalUser.error||finalUser.data.user?.id!==actor)return reply('Account changed. No payment account was saved.',409);
  if(!await connectAttempt('complete',actor,state,url.origin,token.stripe_user_id))return reply('Connection was not saved. Return to Settings to check the current account before starting again.',409);
  return NextResponse.redirect(new URL('/settings',url.origin),{status:303,headers:{'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}});
 }catch{return reply('Stripe connection was not completed. Return to Settings to check its status before starting again.',502);}
}
