import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'crypto';
export const runtime = 'nodejs';
const link = 'https://www.microfreelancehub.com/challenge?utm_source=welcome_email&utm_medium=email&utm_campaign=client_ready';
const reply = (body: object, status=200) => NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function POST(req: Request) {
 const origin=req.headers.get('origin');
 if (!origin || origin!==new URL(req.url).origin) return reply({error:'Please submit from the challenge page.'},403);
 if (Number(req.headers.get('content-length')||0)>4096) return reply({error:'Request too large.'},413);
 let b; try {const raw=await req.text();if(raw.length>4096)return reply({error:'Request too large.'},413);b=JSON.parse(raw);}catch{return reply({error:'Invalid form.'},400);}
 if (!b || typeof b!=='object' || Array.isArray(b)) return reply({error:'Invalid form.'},400);
 if (b.website) return reply({message:'Request received. You can start the lessons below.'});
 const name=typeof b.name==='string'?b.name.trim():'';
 const email=typeof b.email==='string'?b.email.trim().toLowerCase():'';
 if (!name || name.length>80 || /[\r\n<>]/.test(name) || email.length>254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || b.consent!==true) return reply({error:'Enter your name, a valid email, and agree to receive the welcome email.'},400);
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const apiKey=process.env.RESEND_API_KEY;
 if(!key||!url||!apiKey)return reply({error:'Signup is temporarily unavailable. You can still start the lessons below.'},503);
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const ip=req.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()||req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';
 const rateKey=createHmac('sha256',key).update(ip).digest('hex');
 try {
 const {data,error}=await db.rpc('claim_challenge_welcome',{p_name:name,p_email:email,p_rate_key:rateKey});
 if(error||!data)throw new Error('save');
 if(data.action==='limited')return reply({error:'Too many attempts. Please try again in an hour, or start the lessons below.'},429);
 if(data.action==='wait')return reply({error:'Your request is processing. Please wait two minutes before retrying.'},409);
 if(data.action==='held')return reply({error:'Your signup is saved, but email needs a delivery check. Start below or contact joshuastevenclark@gmail.com.'},503);
 if(data.action==='send'){
 const text=`Hi ${data.name},\n\nWelcome to the free Client-Ready Project Challenge!\n\nStart here: ${link}\n\nEverything is ready on that page: the video, three lessons, and a downloadable worksheet. No account, payment or scheduled live session is required.\n\n1. Define your deliverables, client inputs and exclusions.\n2. Outline review and payment milestones.\n3. Write a calm response to an extra request.\n\nAllow about 10 minutes per lesson. Take one a day or finish at your own pace. Use the worksheet to create your project brief, then download it to keep a copy.\n\nWatch the walkthrough: https://youtu.be/5e4SpQIa-Vo\n\nQuestions? Reply to this email.\n\nYou requested this one-time welcome email. This does not subscribe you to marketing emails or a paid plan. If you did not request it, you can ignore it.\n\nMicroFreelanceHub\nhttps://www.microfreelancehub.com/privacy-policy`;
 const res=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json','Idempotency-Key':`challenge-welcome-${data.id}`},body:JSON.stringify({from:'MicroFreelanceHub <support@microfreelancehub.com>',to:[data.email],reply_to:['joshuastevenclark@gmail.com'],subject:'Your free Client-Ready Challenge: start here',text}),signal:AbortSignal.timeout(15000)});
 if(!res.ok){await db.from('challenge_enrollments').update({email_status:'failed',claimed_at:null}).eq('id',data.id);return reply({error:'Your signup is saved, but the welcome email could not be sent. Please retry shortly or start the lessons below.'},503);}
 const sent=await res.json();const saved=await db.from('challenge_enrollments').update({email_status:'sent',resend_id:sent.id}).eq('id',data.id);
 if(saved.error)throw new Error('delivery-status');
 }
 return reply({message:'You’re signed up! Check your inbox (and spam folder) for the welcome email. If you signed up before, use your original email. You can start the lessons below now.'});
 }catch{return reply({error:'We could not confirm your signup or email delivery. Please retry in two minutes. The lessons below are available now.'},503);}
}
