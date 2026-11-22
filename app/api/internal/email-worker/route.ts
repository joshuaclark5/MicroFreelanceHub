import {NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
import {emailWorkerAuthorized,emailWorkerConfigured} from '../../../lib/server/emailWorkerConfig';
import {runEmailWorkerBatch} from '../../../lib/server/emailWorkerBatch';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'}});
async function handle(request:Request){
 if(!emailWorkerAuthorized(request.headers.get('authorization')))return reply({error:'Unauthorized.'},401);
 if(new URL(request.url).search)return reply({error:'Unexpected query.'},400);
 if(!emailWorkerConfigured())return reply({error:'Email worker disabled.'},503);
 const deadline=AbortSignal.timeout(45000);
 const boundedFetch:typeof fetch=(input,init)=>fetch(input,{...init,signal:AbortSignal.any([deadline,init?.signal||AbortSignal.timeout(15000)])});
 try{
  const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{
   auth:{persistSession:false,autoRefreshToken:false},
   global:{fetch:(input,init)=>boundedFetch(input,{...init,signal:AbortSignal.timeout(3000)})}
  });
  return reply(await runEmailWorkerBatch(db,process.env,boundedFetch));
 }catch{return reply({error:'Email worker incomplete. Inspect durable outbox status; do not resend unknown outcomes.'},503);}
}
// Vercel invokes GET; manual POST has exactly the same secret and feature gates.
// No request body is interpreted, and cookies never authorize this machine route.
export const GET=handle;
export const POST=handle;
