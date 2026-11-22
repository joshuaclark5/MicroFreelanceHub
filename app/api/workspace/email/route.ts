import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {createRouteHandlerClient} from '@supabase/auth-helpers-nextjs';
import {createClient} from '@supabase/supabase-js';
import {emailInput} from '../../../lib/emailOutbox';
import {emailHash,emailKeyring,sealEmailToken} from '../../../lib/server/emailCrypto';
import {emailProviderConfig} from '../../../lib/server/emailProvider';
import {emailWorkerScheduled} from '../../../lib/server/emailWorkerConfig';
export const runtime='nodejs';export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}});
const validId=(s:string|null)=>!!s&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
function readiness(){let encryption=false,sending=false;try{emailKeyring();encryption=true;}catch{}try{emailProviderConfig();sending=encryption;}catch{}return {enqueueConfigured:encryption&&process.env.EMAIL_OUTBOX_ENQUEUE_ENABLED==='true'&&!!process.env.SUPABASE_SERVICE_ROLE_KEY&&!!process.env.NEXT_PUBLIC_SUPABASE_URL,sendConfigured:sending,workerScheduled:emailWorkerScheduled()};}
function failure(code?:string){const status=code==='42501'?403:code==='40001'||code==='23505'?409:code==='54000'?429:['22023','22P02','23514'].includes(code||'')?400:503;return reply({code:status===409?'email_conflict':status===429?'email_rate_limited':'email_unavailable',error:status===409?'Email request already exists or changed. Reload its status; do not create another request.':status===429?'Email request limit reached. Try later.':'Email request unavailable. Reload status before retrying the same operation.'},status);}
async function handle(request:Request,method:'GET'|'POST'){
 try{
 const url=new URL(request.url);
 if(method==='POST'){
  if(request.headers.get('origin')!==url.origin)return reply({error:'Request origin not allowed.'},403);
  if(request.headers.get('content-type')?.split(';')[0]!=='application/json')return reply({error:'JSON required.'},415);
  if(url.search)return reply({error:'Unexpected query.'},400);
 }
 const cookieStore=cookies(),db=createRouteHandlerClient({cookies:()=>cookieStore});
 const {data:{user},error}=await db.auth.getUser();if(error||!user)return reply({error:'Sign in required.'},401);
 if(method==='GET'){
  if(Array.from(url.searchParams.keys()).some(k=>!['expectedActorId','after'].includes(k))||Array.from(url.searchParams.keys()).some(k=>url.searchParams.getAll(k).length!==1))return reply({error:'Unexpected query.'},400);
  const expected=url.searchParams.get('expectedActorId'),after=url.searchParams.get('after');
  if(!validId(expected)||(after!==null&&!validId(after)))return reply({error:'Valid expected actor and cursor required.'},400);
  if(expected!==user.id)return reply({code:'account_changed',error:'The signed-in account changed.'},409);
  const result=await db.rpc('workspace_email_snapshot',{expected_actor_id:user.id,after_id:after});if(result.error)return failure(result.error.code);
  return reply({...result.data,readiness:readiness()});
 }
 let body;try{const raw=await request.text();if(raw.length>4096)return reply({error:'Request too large.'},413);body=emailInput(JSON.parse(raw));}catch{return reply({error:'Invalid email request or missing explicit consent.'},400);}
 if(body.expectedActorId!==user.id)return reply({code:'account_changed',error:'The signed-in account changed. Request not queued.'},409);
 if(body.action==='cancel'){
  const result=await db.rpc('workspace_email_cancel',{expected_actor_id:user.id,email_id:body.id});if(result.error)return failure(result.error.code);return reply({actorId:user.id,record:result.data});
 }
 if(!readiness().enqueueConfigured)return reply({code:'email_not_configured',error:'Email queue unavailable. Manual invitations remain unchanged; no email was sent.'},503);
 const ring=emailKeyring(),invite=body.action==='enqueueInvitation';
 const token=invite?body.token as string:null;
 const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});
 const result=await admin.rpc('workspace_email_enqueue',{p_actor:user.id,p_operation:body.operationId,p_template:invite?'team-invitation.v1':'booking-reminder.v1',p_aggregate:invite?body.inviteId:body.bookingId,p_recipient:invite?null:body.recipient,p_token_hash:token?emailHash(token):null,p_ciphertext:token?sealEmailToken(token,[user.id,body.operationId,body.inviteId].join(':'),ring):null,p_consent:body.consentVersion});
 if(result.error)return failure(result.error.code);return reply({actorId:user.id,record:result.data,notice:'Queued is not sent or delivered.'},202);
 }catch{return failure();}
}
export const GET=(request:Request)=>handle(request,'GET');
export const POST=(request:Request)=>handle(request,'POST');
