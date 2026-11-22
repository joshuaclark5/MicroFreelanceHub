import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {createRouteHandlerClient} from '@supabase/auth-helpers-nextjs';
import {createClient} from '@supabase/supabase-js';
import {parseTestAction,runTestBilling,testBillingConfig,TestBillingError} from '../../../lib/server/testBilling';
export const dynamic='force-dynamic';
export const runtime='nodejs';
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
function storage(){if(!process.env.SUPABASE_SERVICE_ROLE_KEY)throw Error('Unavailable');return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});}
export async function GET(){
 try{const cookieStore=cookies(),auth=createRouteHandlerClient({cookies:()=>cookieStore}),u=await auth.auth.getUser();
 if(u.error||!u.data.user)return reply({error:'Sign in required.'},401);
 const available=!!testBillingConfig()&&!!process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!available)return reply({actorId:u.data.user.id,available:false,record:null});
 const r=await storage().from('test_billing_sandboxes').select('status,subscription_id,created_at').eq('owner_id',u.data.user.id).maybeSingle();
 if(r.error)throw r.error;
 return reply({actorId:u.data.user.id,available:true,record:r.data});
 }catch{return reply({error:'Test sandbox unavailable. Configuration or migration may be missing.'},503);}
}
export async function POST(request:Request){
 try{
 const url=new URL(request.url),config=testBillingConfig();
 if(request.headers.get('origin')!==url.origin||(config&&config.origin!==url.origin))return reply({error:'Request origin not allowed.'},403);
 if(url.search)return reply({error:'Invalid query.'},400);
 if(request.headers.get('content-type')?.split(';')[0]!=='application/json')return reply({error:'JSON required.'},415);
 const cookieStore=cookies(),auth=createRouteHandlerClient({cookies:()=>cookieStore}),u=await auth.auth.getUser();
 if(u.error||!u.data.user)return reply({error:'Sign in required.'},401);
 const actor=u.data.user.id;
 let action:'create'|'refresh'|'cancel';
 try{const raw=await request.text();if(raw.length>1024)return reply({error:'Request too large.'},413);action=parseTestAction(JSON.parse(raw),actor);}catch{return reply({error:'Invalid request, account mismatch, or missing explicit consent.'},400);}
 if(!config)return reply({error:'Test billing is disabled or a dedicated test key is unavailable.'},503);
 const db=storage();
 const recheck=async()=>{const next=await auth.auth.getUser();if(next.error||next.data.user?.id!==actor)throw new TestBillingError('Account changed. Reload.');};
 await recheck();
 if(action==='create'){const r=await db.from('test_billing_sandboxes').upsert({owner_id:actor},{onConflict:'owner_id',ignoreDuplicates:true});if(r.error)throw r.error;}
 const r=await db.from('test_billing_sandboxes').select('*').eq('owner_id',actor).single();if(r.error||!r.data)throw Error('Unavailable');
 const result=await runTestBilling(config,r.data,action,{save:async patch=>{const s=await db.from('test_billing_sandboxes').update(patch).eq('owner_id',actor).eq('operation_id',r.data.operation_id);if(s.error)throw s.error;}},recheck);
 await recheck();return reply({actorId:actor,...result});
 }catch{return reply({error:'Sandbox outcome unconfirmed. Retry the same action. Incomplete operations older than 23 hours require operator reconciliation; never start a replacement.'},503);}
}
