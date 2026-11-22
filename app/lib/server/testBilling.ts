import 'server-only';
import {createHash} from 'node:crypto';

export class TestBillingError extends Error {}
export function testBillingConfig(env:NodeJS.ProcessEnv=process.env){
 const key=env.STRIPE_TEST_SECRET_KEY;
 // Deliberately no fallback to the application's existing billing credentials.
 if(env.STRIPE_TEST_BILLING_ENABLED!=='true'||!key||!/^sk_test_[A-Za-z0-9]+$/.test(key))return null;
 try{const u=new URL(env.STRIPE_TEST_APP_ORIGIN||'');if(u.origin!==env.STRIPE_TEST_APP_ORIGIN||!(u.protocol==='https:'||(u.protocol==='http:'&&u.hostname==='localhost')))return null;return {key,origin:u.origin};}catch{return null;}
}
export function assertTestObject(value:any):void{
 if(!value||typeof value!=='object'||value.livemode!==false)throw new TestBillingError('Non-test or invalid provider response.');
 const walk=(v:any):void=>{if(!v||typeof v!=='object')return;if('livemode'in v&&v.livemode!==false)throw new TestBillingError('Non-test provider response.');for(const x of Object.values(v))walk(x);};walk(value);
}
export function parseTestAction(p:any,actor:string){
 if(!p||typeof p!=='object'||Array.isArray(p)||Object.keys(p).some(k=>!['action','expectedActorId','consent'].includes(k))||!['create','refresh','cancel'].includes(p.action))throw new TestBillingError('Invalid request.');
 if(p.expectedActorId!==actor)throw new TestBillingError('Account changed. Reload.');
 if(p.action==='create'&&p.consent!==true)throw new TestBillingError('Explicit test-only consent required.');
 return p.action as 'create'|'refresh'|'cancel';
}
export type SandboxRecord={owner_id:string;operation_id:string;created_at:string;customer_id:string|null;product_id:string|null;subscription_id:string|null;status:string};
export type SandboxStore={save:(patch:Partial<SandboxRecord>)=>Promise<void>};
export async function runTestBilling(config:NonNullable<ReturnType<typeof testBillingConfig>>,row:SandboxRecord,action:'create'|'refresh'|'cancel',store:SandboxStore,recheck:()=>Promise<void>,transport:typeof fetch=fetch){
 // Validate even callers that construct a config themselves.
 if(!/^sk_test_[A-Za-z0-9]+$/.test(config.key))throw new TestBillingError('Test key required.');
 const marker=createHash('sha256').update(row.owner_id+':'+row.operation_id).digest('hex');
 async function api(path:string,method:string,params?:Record<string,string>,step?:string){
  await recheck();
  const response=await transport('https://api.stripe.com/v1/'+path,{method,redirect:'error',signal:AbortSignal.timeout(15000),headers:{Authorization:'Bearer '+config.key,'Content-Type':'application/x-www-form-urlencoded','Stripe-Version':'2023-10-16',...(step?{'Idempotency-Key':'mfh-test-'+marker+'-'+step}:{})},...(params?{body:new URLSearchParams(params)}:{})});
  if(!response.ok)throw new TestBillingError('Test provider request failed. Retry the same operation.');
  const v=await response.json();assertTestObject(v);return v;
 }
 function owned(v:any,prefix:string){if(typeof v.id!=='string'||!new RegExp('^'+prefix+'_[A-Za-z0-9]+$').test(v.id)||v.metadata?.sandbox_operation!==marker)throw new TestBillingError('Unrecognized sandbox resource.');return v;}
 function id(v:string,prefix:string){if(!new RegExp('^'+prefix+'_[A-Za-z0-9]+$').test(v))throw new TestBillingError('Invalid stored resource.');return v;}
 if(!row.subscription_id){
  if(action!=='create')throw new TestBillingError('Creation is incomplete. Retry creation first.');
  // Stripe only guarantees idempotency retention for 24h. Never recreate an uncertain old operation.
  if(!Number.isFinite(Date.parse(row.created_at))||Date.now()-Date.parse(row.created_at)>23*3600000)throw new TestBillingError('Expired incomplete operation. Operator reconciliation required.');
  if(!row.customer_id){const c=owned(await api('customers','POST',{'name':'MFH synthetic sandbox customer','metadata[sandbox_operation]':marker},'customer'),'cus');row.customer_id=c.id;await store.save({customer_id:c.id});}
  else owned(await api('customers/'+id(row.customer_id,'cus'),'GET'),'cus');
  if(!row.product_id){const p=owned(await api('products','POST',{'name':'MFH TEST ONLY recurring sandbox','metadata[sandbox_operation]':marker},'product'),'prod');row.product_id=p.id;await store.save({product_id:p.id});}
  else owned(await api('products/'+id(row.product_id,'prod'),'GET'),'prod');
  // Trial ends automatically after two days without ever adding a payment method.
  // Fixed timestamps ensure crash/retry requests have exactly the same parameters.
  const end=String(Math.floor(Date.parse(row.created_at)/1000)+2*86400);
  const s=owned(await api('subscriptions','POST',{customer:row.customer_id!, 'items[0][price_data][currency]':'usd','items[0][price_data][unit_amount]':'100','items[0][price_data][recurring][interval]':'month','items[0][price_data][product]':row.product_id!,'trial_end':end,'cancel_at':end,'trial_settings[end_behavior][missing_payment_method]':'cancel','payment_settings[save_default_payment_method]':'off','metadata[sandbox_operation]':marker},'subscription'),'sub');
  row.subscription_id=s.id;await store.save({subscription_id:s.id,status:s.status});
 }
 let s=owned(await api('subscriptions/'+id(row.subscription_id!,'sub'),'GET'),'sub');
 if(s.customer!==row.customer_id)throw new TestBillingError('Sandbox customer mismatch.');
 if(action==='cancel'&&s.status!=='canceled')s=owned(await api('subscriptions/'+id(row.subscription_id!,'sub'),'DELETE',undefined,'cancel'),'sub');
 await store.save({status:s.status});
 return {status:s.status,subscriptionId:s.id,testMode:true,trialEnd:s.trial_end,cancelAt:s.cancel_at};
}
