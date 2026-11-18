import {emailRecipient} from '../emailOutbox';
export type EmailProviderConfig={apiKey:string;from:string;siteOrigin:string};
export function emailProviderConfig(env:NodeJS.ProcessEnv=process.env):EmailProviderConfig {
 if(env.EMAIL_OUTBOX_SEND_ENABLED!=='true'||!env.RESEND_API_KEY||!env.EMAIL_OUTBOX_FROM||!env.EMAIL_OUTBOX_SITE_ORIGIN)throw Error('Email sending disabled.');
 const from=emailRecipient(env.EMAIL_OUTBOX_FROM),url=new URL(env.EMAIL_OUTBOX_SITE_ORIGIN);
 if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw Error('Email sending disabled.');
 return {apiKey:env.RESEND_API_KEY,from,siteOrigin:url.origin};
}
export type EmailSendResult={outcome:'accepted'|'retry'|'unknown'|'failed';providerId?:string;retrySeconds?:number};
export async function sendResendEmail(config:EmailProviderConfig,message:{id:string;recipient:string;subject:string;text:string},fetcher:typeof fetch=fetch):Promise<EmailSendResult> {
 // Fixed existing Resend contract, separate sender and consent from marketing. No raw errors/logging.
 try {
 const response=await fetcher('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+config.apiKey,'Content-Type':'application/json','Idempotency-Key':'workspace-email-'+message.id},body:JSON.stringify({from:config.from,to:[emailRecipient(message.recipient)],subject:message.subject,text:message.text}),signal:AbortSignal.timeout(15000),redirect:'error'});
 if(response.status===429){const value=response.headers.get('retry-after');const delay=value&&/^[0-9]+$/.test(value)?Number(value):value?Math.ceil((Date.parse(value)-Date.now())/1000):60;if((value!==null&&!Number.isFinite(delay))||delay>86400)return {outcome:'failed'};return {outcome:'retry',retrySeconds:Number.isFinite(delay)?Math.max(60,delay):60};}
 if(response.status>=500||response.status===408||response.status===409)return {outcome:'unknown'};
 if(!response.ok)return {outcome:'failed'};
 const body=await response.json();if(typeof body.id!=='string'||!/^[A-Za-z0-9_-]{1,100}$/.test(body.id))return {outcome:'unknown'};
 return {outcome:'accepted',providerId:body.id};
 }catch{return {outcome:'unknown'};}
}
export async function readResendEvidence(config:EmailProviderConfig,providerId:string,recipient:string,fetcher:typeof fetch=fetch):Promise<'delivered'|'bounced'|null> {
 if(!/^[A-Za-z0-9_-]{1,100}$/.test(providerId))return null;
 try{const response=await fetcher('https://api.resend.com/emails/'+encodeURIComponent(providerId),{headers:{Authorization:'Bearer '+config.apiKey},signal:AbortSignal.timeout(15000),redirect:'error'});if(!response.ok)return null;
 const body=await response.json();if(body.id!==providerId||!Array.isArray(body.to)||body.to.length!==1||body.to[0].toLowerCase()!==emailRecipient(recipient)||body.from!==config.from)return null;
 return body.last_event==='delivered'?'delivered':body.last_event==='bounced'?'bounced':null;
 }catch{return null;}
}
