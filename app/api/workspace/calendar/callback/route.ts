import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {createRouteHandlerClient} from '@supabase/auth-helpers-nextjs';
import {calendarConfig,CalendarError,digest,unseal,seal,exchange} from '../../../../lib/server/calendarProvider';
import {calendarStore} from '../../../../lib/server/calendarService';
export const dynamic='force-dynamic';
export const runtime='nodejs';
const reply=(body:unknown,status:number)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}});
export async function GET(request:Request){try{const c=calendarConfig();if(!c)return reply({error:'Calendar is not configured.'},503);const url=new URL(request.url),p=url.searchParams;if(url.origin!==c.origin)return reply({error:'Invalid callback origin.'},403);
 if([...p.keys()].some(k=>!['state','code','scope','error','authuser','prompt','iss'].includes(k)||p.getAll(k).length!==1)||(p.has('iss')&&p.get('iss')!=='https://accounts.google.com')||! /^[A-Za-z0-9_-]{43}$/.test(p.get('state')||'')||(!p.has('error')&&(!p.get('code')||p.get('code')!.length>4096)))return reply({error:'Invalid callback.'},400);
 const cookieStore=cookies(),db=createRouteHandlerClient({cookies:()=>cookieStore});const u=await db.auth.getUser();if(u.error||!u.data.user)return reply({error:'Sign in to the original account and start again.'},401);const actor=u.data.user.id,store=calendarStore();const state=await store('consume',actor,{stateHash:digest(p.get('state')!),origin:c.origin});
 if(p.has('error'))return reply({error:'Consent was not completed. Disconnect this attempt before starting again.'},400);
 const verifier=unseal<string>(c,actor,'pkce',state.verifierCipher);let current=await db.auth.getUser();if(current.error||current.data.user?.id!==actor)throw new CalendarError('changed');
 const tokens=await exchange(c,{code:p.get('code')!,verifier});current=await db.auth.getUser();if(current.error||current.data.user?.id!==actor)throw new CalendarError('changed');
 await store('connect',actor,{generation:state.generation,tokenCipher:seal(c,actor,'tokens',tokens)});
 return NextResponse.redirect(new URL('/workspace/connections?calendar=authorized',c.origin),{status:303,headers:{'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}});
 }catch{return reply({error:'Calendar authorization was not completed. Return to connections, disconnect this attempt, and start again. Provider revocation may still be needed in your Google account.'},409);}}
