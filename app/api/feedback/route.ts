import {NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
import {createHash,createHmac} from 'crypto';
import {feedbackInput,feedbackRecipient} from '../../lib/feedbackReport';
import {sendResendEmail} from '../../lib/server/emailProvider';
export const runtime='nodejs';
const reply=(body:object,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function POST(req:Request){
 if(req.headers.get('origin')!==new URL(req.url).origin)return reply({error:'Open the website to send feedback.'},403);
 if(Number(req.headers.get('content-length')||0)>12000)return reply({error:'Report too large.'},413);
 let input;
 try{const raw=await req.text();if(raw.length>12000)return reply({error:'Report too large.'},413);input=feedbackInput(JSON.parse(raw));}
 catch(e){return reply({error:e instanceof Error&&!(e instanceof SyntaxError)?e.message:'Check your report.'},400);}
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY,url=process.env.NEXT_PUBLIC_SUPABASE_URL,apiKey=process.env.RESEND_API_KEY;
 if(!key||!url)return reply({error:'Report email is unavailable. Your text is still here. You can email admin@microfreelancehub.com directly.'},503);
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const ip=req.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()||req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';
 const rateKey=createHmac('sha256',key).update(ip).digest('hex');
 const hash=createHash('sha256').update(JSON.stringify([input.message,input.email])).digest('hex');
 try{
  const claim=await db.rpc('claim_feedback_report',{p_id:input.id,p_hash:hash,p_rate_key:rateKey,p_message:input.message,p_email:input.email});
  if(claim.error||!claim.data)return reply({error:'Report email is unavailable. Keep your draft and try again later.'},503);
  const action=claim.data.action;
  if(action==='limited')return reply({error:'Too many reports right now. Keep your draft and try again in an hour.'},429);
  if(action==='conflict')return reply({error:'This report ID belongs to different text. Do not submit another copy; contact admin@microfreelancehub.com with the reference.'},409);
  if(action==='accepted')return reply({status:'accepted',saved:true,id:input.id});
  if(action!=='send')return reply({status:action==='failed'?'failed':'unknown',saved:true,id:input.id},202);
  if(!apiKey){await db.from('feedback_reports').update({status:'failed',updated_at:new Date().toISOString()}).eq('id',input.id).eq('status','sending');return reply({status:'failed',saved:true,id:input.id},202);}
  const result=await sendResendEmail({apiKey,from:'support@microfreelancehub.com',siteOrigin:new URL(req.url).origin,...(input.email?{replyTo:input.email}:{})},{id:'feedback-'+input.id,recipient:feedbackRecipient,subject:'Website feedback / '+input.id,text:`Report reference: ${input.id}\nReply email: ${input.email||'Not supplied'}\n\n${input.message}\n\nSubmitted through the MicroFreelanceHub feedback form. No page URL or account data was collected automatically.`});
  const status=result.outcome==='accepted'?'accepted':result.outcome==='failed'||result.outcome==='retry'?'failed':'unknown';
  const saved=await db.from('feedback_reports').update({status,provider_id:result.providerId||null,updated_at:new Date().toISOString()}).eq('id',input.id).eq('status','sending');
  // Acceptance is true even if our receipt write failed; never invent delivery.
  return reply({status:status==='accepted'?'accepted':saved.error?'unknown':status,saved:true,id:input.id},status==='accepted'?200:202);
 }catch{return reply({status:'unknown',id:input.id},202);}
}
