import {NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
import {randomBytes,randomUUID,createHash} from 'crypto';
import {verifiedAgreementSession} from '../../lib/server/agreementSession';
import {sendResendEmail} from '../../lib/server/emailProvider';
export const runtime='nodejs';
const reply=(body:object,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function POST(req:Request){
 if(req.headers.get('origin')!==new URL(req.url).origin)return reply({error:'Open the agreement page to verify.'},403);
 try{
  const raw=await req.text();if(raw.length>1000)return reply({error:'Invalid request.'},400);
  const input=JSON.parse(raw);
  if(typeof input.document!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.document)||!['send','verify'].includes(input.action))return reply({error:'Invalid request.'},400);
  const identity=await verifiedAgreementSession();if(!identity)return reply({error:'Sign in again using the intended recipient email.'},401);
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY,url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  if(!key||!url)return reply({error:'Verification is unavailable. Try again later.'},503);
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const args={p_document:input.document,p_actor:identity.actor,p_session:identity.session};
  if(input.action==='verify'){
   if(typeof input.code!=='string'||!/^[a-f0-9]{32}$/i.test(input.code.trim()))return reply({error:'Paste the complete code from your email.'},400);
   const checked=await db.rpc('finish_recipient_challenge',{...args,p_hash:createHash('sha256').update(input.code.trim().toLowerCase()).digest('hex')});
   if(checked.error||checked.data!==true)return reply({error:'Code not confirmed. Use the latest code in this browser within 15 minutes. After five attempts, request a new code.'},400);
   return reply({verified:true});
  }
  const apiKey=process.env.RESEND_API_KEY;
  if(!apiKey)return reply({error:'Verification email is unavailable. Try again later.'},503);
  const code=randomBytes(16).toString('hex'),id=randomUUID();
  const started=await db.rpc('start_recipient_challenge',{...args,p_id:id,p_hash:createHash('sha256').update(code).digest('hex')});
  if(started.error||typeof started.data!=='string')return reply({error:started.error?.code==='54000'?'Request limit reached. Try again in an hour.':'Verification unavailable. Sign in with the address the sender used, or ask the sender to check the link.'},started.error?.code==='54000'?429:403);
  const result=await sendResendEmail({apiKey,from:'support@microfreelancehub.com',siteOrigin:new URL(req.url).origin},{id:'agreement-recipient-'+id,recipient:started.data,subject:'Your agreement review verification code',text:`You requested access to review an agreement on MicroFreelanceHub.\n\nVerification code: ${code}\n\nPaste this code in the same browser where you requested it. It expires in 15 minutes. Do not share this code with anyone. If you did not request it, ignore this email. No agreement content is included in this email.`});
  if(result.outcome!=='accepted')return reply({error:result.outcome==='unknown'?'Email status is uncertain. Check your inbox before requesting another code.':'Email was not accepted. Wait before requesting another code.'},503);
  return reply({status:'accepted',message:'Email provider accepted the request. Check your inbox and spam folder; delivery is not yet confirmed.'});
 }catch{return reply({error:'Verification could not be confirmed. Keep this page open and try again later.'},503);}
}
