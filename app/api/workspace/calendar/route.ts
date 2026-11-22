import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {createRouteHandlerClient} from '@supabase/auth-helpers-nextjs';
import {calendarConfig,CalendarError,opaque,digest,seal,authorizationUrl} from '../../../lib/server/calendarProvider';
import {calendarStore,syncCalendar} from '../../../lib/server/calendarService';
export const dynamic='force-dynamic';
export const runtime='nodejs';
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}});
const failure=(e:unknown)=>reply({error:e instanceof CalendarError&&['changed','busy_or_reconnect'].includes(e.code)?'Calendar changed or work is in progress. Reload before retrying.':'Calendar unavailable. Reconnect or retry after the displayed wait.'},e instanceof CalendarError&&['changed','busy_or_reconnect'].includes(e.code)?409:503);
export async function GET(request:Request){try{const cookieStore=cookies(),db=createRouteHandlerClient({cookies:()=>cookieStore});const u=await db.auth.getUser();if(u.error||!u.data.user)return reply({error:'Sign in required.'},401);const actor=u.data.user.id,p=new URL(request.url).searchParams;if([...p.keys()].some(k=>k!=='expectedActorId'||p.getAll(k).length!==1))return reply({error:'Invalid query.'},400);if(p.has('expectedActorId')&&p.get('expectedActorId')!==actor)return reply({error:'Account changed. Reload.'},409);const r=await db.rpc('calendar_status',{expected_actor_id:actor});if(r.error)throw new CalendarError('storage_unavailable');const again=await db.auth.getUser();if(again.error||again.data.user?.id!==actor)return reply({error:'Account changed. Reload.'},409);return reply({actorId:actor,available:!!calendarConfig()&&!!process.env.SUPABASE_SERVICE_ROLE_KEY,connection:r.data});}catch(e){return failure(e);}}
export async function POST(request:Request){try{const url=new URL(request.url);if(request.headers.get('origin')!==url.origin)return reply({error:'Request origin not allowed.'},403);if(request.headers.get('content-type')?.split(';')[0]!=='application/json')return reply({error:'JSON required.'},415);if(url.search)return reply({error:'Invalid query.'},400);
 const cookieStore=cookies(),db=createRouteHandlerClient({cookies:()=>cookieStore});const u=await db.auth.getUser();if(u.error||!u.data.user)return reply({error:'Sign in required.'},401);const actor=u.data.user.id;
 let p;try{const raw=await request.text();if(raw.length>2048)return reply({error:'Request too large.'},413);p=JSON.parse(raw);}catch{return reply({error:'Invalid JSON.'},400);}
 if(!p||typeof p!=='object'||Array.isArray(p)||!['connect','sync','disconnect'].includes(p.action)||Object.keys(p).some(k=>!['action','expectedActorId',...(p.action==='connect'?['calendar','consent']:[])].includes(k)))return reply({error:'Invalid request.'},400);
 if(p.expectedActorId!==actor)return reply({error:'Account changed. Reload.'},409);
 const recheck=async()=>{const current=await db.auth.getUser();if(current.error||current.data.user?.id!==actor)throw new CalendarError('changed');};await recheck();
 const store=calendarStore();if(p.action==='disconnect')return reply({actorId:actor,...await store('disconnect',actor)});
 const config=calendarConfig();if(!config)return reply({error:'Calendar is not configured. Not connected.'},503);if(config.origin!==url.origin)return reply({error:'Request origin not allowed.'},403);
 if(p.action==='connect'){if(p.calendar!=='primary'||p.consent!==true)return reply({error:'Explicit primary-calendar busy-only consent required.'},400);const state=opaque(),verifier=opaque();await store('begin',actor,{stateHash:digest(state),verifierCipher:seal(config,actor,'pkce',verifier),origin:config.origin});return reply({actorId:actor,authorizationUrl:authorizationUrl(config,state,verifier)});}
 const s=await db.rpc('calendar_status',{expected_actor_id:actor});if(s.error||!s.data||s.data.status!=='connected')throw new CalendarError('busy_or_reconnect');return reply({actorId:actor,...await syncCalendar(config,store,actor,s.data.generation,recheck)});
 }catch(e){return failure(e);}}
