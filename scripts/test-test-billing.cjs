const fs=require('fs'),vm=require('vm'),ts=require('typescript'),assert=require('assert/strict'),crypto=require('crypto');
const exportsLib={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/lib/server/testBilling.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:exportsLib,require:n=>n==='server-only'?{}:require(n),process:{env:{}},URL,URLSearchParams,AbortSignal,Date,fetch:()=>{throw Error('No real network allowed');}});
const lib=exportsLib;
const env={STRIPE_TEST_BILLING_ENABLED:'true',STRIPE_TEST_SECRET_KEY:'sk_test_fixture',STRIPE_TEST_APP_ORIGIN:'https://example.invalid'},config=lib.testBillingConfig(env);
let checks=0;async function check(name,fn){await fn();checks++;console.log('PASS '+name);}
(async()=>{
await check('dedicated key opt-in only; rejects live, restricted, fallback and malformed origins',()=>{
 assert.ok(config);
 for(const e of [{},{...env,STRIPE_TEST_BILLING_ENABLED:'false'},{...env,STRIPE_TEST_SECRET_KEY:'sk_live_fixture'},{...env,STRIPE_TEST_SECRET_KEY:'rk_live_fixture'},{...env,STRIPE_TEST_SECRET_KEY:'rk_test_fixture'},{...env,STRIPE_TEST_SECRET_KEY:'',STRIPE_SECRET_KEY:'sk_test_fixture'},{...env,STRIPE_TEST_APP_ORIGIN:'https://example.invalid/path'}])assert.equal(lib.testBillingConfig(e),null);
});
await check('owner and explicit consent and unknown fields enforced',()=>{
 assert.equal(lib.parseTestAction({action:'create',consent:true,expectedActorId:'a'},'a'),'create');
 for(const p of [{action:'create',expectedActorId:'a'},{action:'create',consent:true,expectedActorId:'b'},{action:'cancel',expectedActorId:'a',customer:'cus_foreign'},{action:'create',consent:true,expectedActorId:'a',secret:'sk_live_fixture'}])assert.throws(()=>lib.parseTestAction(p,'a'));
});
await check('missing and nested live-mode objects fail closed',()=>{
 for(const p of [{id:'x'},{livemode:true},{livemode:false,items:{data:[{livemode:true}]}}])assert.throws(()=>lib.assertTestObject(p));lib.assertTestObject({livemode:false,items:{data:[{livemode:false}]}});
});
function fixture(){
 const row={owner_id:crypto.randomUUID(),operation_id:crypto.randomUUID(),created_at:new Date().toISOString(),customer_id:null,product_id:null,subscription_id:null,status:'pending'},calls=[],objects={},keys=new Map();
 let auth=0,failSave=false;
 const store={save:async patch=>{if(failSave){failSave=false;throw Error('storage outage');}Object.assign(row,patch);}};
 const transport=async(url,opts)=>{
  calls.push([url,opts]);assert.equal(opts.redirect,'error');assert.ok(opts.headers.Authorization.startsWith('Bearer sk_test_'));const path=url.replace('https://api.stripe.com/v1/',''),params=Object.fromEntries(opts.body||[]),key=opts.headers['Idempotency-Key'];
  if(opts.method==='POST'){
   assert.ok(key);assert.ok(!('email'in params));assert.ok(!('default_payment_method'in params));
   if(keys.has(key)){assert.deepEqual(keys.get(key).params,params);return new Response(JSON.stringify(keys.get(key).obj));}
   const prefix={customers:'cus',products:'prod',subscriptions:'sub'}[path],obj={id:prefix+'_synthetic',livemode:false,metadata:{sandbox_operation:params['metadata[sandbox_operation]']},...(prefix==='sub'?{status:'trialing',customer:params.customer,trial_end:Number(params.trial_end),cancel_at:Number(params.cancel_at)}:{})};
   keys.set(key,{params,obj});objects[obj.id]=obj;return new Response(JSON.stringify(obj));
  }
  const obj=objects[path.split('/')[1]];if(opts.method==='DELETE')obj.status='canceled';return new Response(JSON.stringify(obj));
 };
 return {row,calls,store,transport,keys,objects,recheck:async()=>{auth++;},auth:()=>auth,fail:()=>{failSave=true;}};
}
await check('real orchestration creates isolated fixed trial, reuses resources, refreshes and cancels',async()=>{
 const f=fixture(),run=a=>lib.runTestBilling(config,f.row,a,f.store,f.recheck,f.transport);
 assert.equal((await run('create')).status,'trialing');assert.equal(f.keys.size,3);
 const sub=f.calls.find(([u,o])=>u.endsWith('/subscriptions')&&o.method==='POST')[1].body;
 assert.equal(sub.get('cancel_at'),sub.get('trial_end'));assert.equal(sub.get('trial_settings[end_behavior][missing_payment_method]'),'cancel');assert.equal(sub.get('items[0][price_data][unit_amount]'),'100');
 await run('create');await run('refresh');assert.equal(f.keys.size,3);
 assert.equal((await run('cancel')).status,'canceled');await run('cancel');
 assert.equal(f.calls.filter(([,o])=>o.method==='DELETE').length,1);assert.equal(f.auth(),f.calls.length);
});
await check('storage outage replays same Stripe idempotency key with fixed params',async()=>{
 const f=fixture();f.fail();await assert.rejects(lib.runTestBilling(config,{...f.row},'create',f.store,f.recheck,f.transport));
 await lib.runTestBilling(config,{...f.row},'create',f.store,f.recheck,f.transport);
 assert.equal(f.keys.size,3);assert.equal(f.calls[0][1].headers['Idempotency-Key'],f.calls[1][1].headers['Idempotency-Key']);
});
await check('stale uncertain requests and changed owner auth cannot create resources',async()=>{
 const f=fixture();f.row.created_at=new Date(Date.now()-24*3600000).toISOString();
 await assert.rejects(lib.runTestBilling(config,f.row,'create',f.store,f.recheck,f.transport));assert.equal(f.calls.length,0);
 f.row.created_at=new Date().toISOString();
 await assert.rejects(lib.runTestBilling(config,f.row,'create',f.store,async()=>{throw Error('changed');},f.transport));assert.equal(f.calls.length,0);
 await assert.rejects(lib.runTestBilling({...config,key:'sk_live_fixture'},f.row,'create',f.store,f.recheck,f.transport));assert.equal(f.calls.length,0);
});
await check('live provider response aborts before follow-on writes or requests',async()=>{
 const f=fixture();let count=0;await assert.rejects(lib.runTestBilling(config,f.row,'create',f.store,f.recheck,async()=>{count++;return new Response(JSON.stringify({id:'cus_bad',livemode:true}));}));assert.equal(count,1);assert.equal(f.row.customer_id,null);
});
console.log(checks+' logic checks passed. Fixture transport only; not provider verification.');
})().catch(e=>{console.error(e);process.exitCode=1;});
