import {createHash,timingSafeEqual} from 'node:crypto';
import schedule from '../../../vercel.json';
import {emailKeyring} from './emailCrypto';
import {emailProviderConfig} from './emailProvider';

export function emailWorkerAuthorized(header:string|null,env:NodeJS.ProcessEnv=process.env):boolean {
 const secret=env.CRON_SECRET;
 // Missing, weak or malformed configuration cannot authorize any request.
 if(!secret||secret.length<32||secret.length>256||!/^[\x21-\x7e]+$/.test(secret))return false;
 const digest=(value:string)=>createHash('sha256').update(value).digest();
 return timingSafeEqual(digest(header||''),digest('Bearer '+secret));
}
export function emailWorkerConfigured(env:NodeJS.ProcessEnv=process.env):boolean {
 if(env.EMAIL_OUTBOX_WORKER_ENABLED!=='true'||!env.NEXT_PUBLIC_SUPABASE_URL||!env.SUPABASE_SERVICE_ROLE_KEY||!emailWorkerAuthorized('Bearer '+env.CRON_SECRET,env))return false;
 try{emailKeyring(env);emailProviderConfig(env);return true;}catch{return false;}
}
export function emailWorkerScheduled(env:NodeJS.ProcessEnv=process.env):boolean {
 // Configuration readiness, never proof that a cron invocation/provider succeeded.
 return env.VERCEL_ENV==='production'&&emailWorkerConfigured(env)&&schedule.crons.some(job=>job.path==='/api/internal/email-worker'&&job.schedule==='*/5 * * * *');
}
