const fs=require('fs'),vm=require('vm'),ts=require('typescript'),assert=require('node:assert/strict');
let verified=true,fail=false,agreement=0,reconciled=0;
const logs=[];
class Response { constructor(body,o){this.body=body;this.status=o?.status||200;} static json(body,o){return new Response(body,o);} }
class Stripe { webhooks={constructEvent:body=>{if(!verified)throw Error('PRIVATE SIGNATURE DETAILS');return JSON.parse(body);}}; }
const mocks={
 'next/headers':{headers:()=>({get:()=>null})},'next/server':{NextResponse:Response},stripe:Stripe,
 '@supabase/supabase-js':{createClient:()=>({from:()=>({select:()=>({eq:()=>({single:async()=>({data:{id:'document'}})})})})})},
 '../../lib/recordAgreementPayment':{recordAgreementPayment:async()=>{agreement++;}},
 '../../lib/server/subscriptionLifecycle':{reconcileSubscriptionEvent:async()=>{reconciled++;if(fail)throw Error('PRIVATE PROVIDER DETAILS');}},
};
const exportsObject={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/api/webhooks/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,{exports:exportsObject,process:{env:{STRIPE_SECRET_KEY:'sk_live_fixture'}},console:{warn:x=>logs.push(x)},require:n=>{assert(n in mocks,n);return mocks[n];}});
const send=e=>exportsObject.POST({text:async()=>JSON.stringify(e)});
(async()=>{
 const e={id:'evt_one',livemode:true,type:'customer.subscription.updated',data:{object:{}}};
 verified=false;let r=await send(e);assert.equal(r.status,400);assert(!JSON.stringify(r).includes('PRIVATE'));assert.equal(reconciled,0);
 verified=true;r=await send({...e,livemode:false});assert.equal(r.status,400);assert.equal(reconciled,0);
 r=await send(e);assert.equal(r.status,200);assert.equal(reconciled,1);
 fail=true;r=await send(e);assert.equal(r.status,500);assert(!JSON.stringify(r).includes('PRIVATE'));fail=false;
 const before=reconciled;r=await send({...e,type:'checkout.session.completed',data:{object:{payment_status:'paid',metadata:{purpose:'agreement_payment',sow_id:'document'}}}});assert.equal(r.status,200);assert.equal(agreement,1);assert.equal(reconciled,before);
 assert(logs.every(s=>!s.includes('PRIVATE')));
 console.log('PASS: actual webhook rejects invalid signature/wrong environment, requests retry on reconciliation failure, and keeps client payments separate with sanitized errors.');
})().catch(e=>{console.error(e);process.exitCode=1;});
