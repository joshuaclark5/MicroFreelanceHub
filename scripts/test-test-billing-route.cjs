const fs=require('fs'),vm=require('vm'),ts=require('typescript'),assert=require('assert/strict');
function load(file,mocks,env={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:n=>{assert.ok(n in mocks,n);return mocks[n];},process:{env},URL,URLSearchParams,AbortSignal,Request,Response,Date,fetch:()=>{throw Error('No network');}});return exports;}
const lib=load('app/lib/server/testBilling.ts',{'server-only':{},'node:crypto':require('crypto')});
let actor='a',queries=0,providerCalls=0,operations=[];
const record={owner_id:'a',operation_id:'op',created_at:new Date().toISOString(),status:'pending'};
const db={from:table=>{queries++;assert.equal(table,'test_billing_sandboxes');const q={select:()=>q,eq:(k,v)=>{operations.push([k,v]);return q;},single:async()=>({data:record}),maybeSingle:async()=>({data:record}),upsert:async(p,o)=>{assert.deepEqual(JSON.parse(JSON.stringify(p)),{owner_id:actor});assert.equal(o.ignoreDuplicates,true);return {};}};return q;}};
const route=load('app/api/workspace/test-billing/route.ts',{'next/server':{NextResponse:{json:(b,o)=>new Response(JSON.stringify(b),o)}},'next/headers':{cookies:()=>({})},'@supabase/auth-helpers-nextjs':{createRouteHandlerClient:()=>({auth:{getUser:async()=>({data:{user:actor?{id:actor}:null}})}})},'@supabase/supabase-js':{createClient:()=>db},'../../../lib/server/testBilling':{...lib,testBillingConfig:()=>({key:'sk_test_fixture',origin:'https://example.invalid'}),runTestBilling:async(c,row,action,store,recheck)=>{providerCalls++;await recheck();assert.equal(row.owner_id,actor);return {status:'trialing',testMode:true};}}},{SUPABASE_SERVICE_ROLE_KEY:'fixture',NEXT_PUBLIC_SUPABASE_URL:'https://db.invalid'});
const req=(body,origin='https://example.invalid',type='application/json')=>new Request('https://example.invalid/api/workspace/test-billing',{method:'POST',headers:{origin,'content-type':type},body:JSON.stringify(body)});
(async()=>{
assert.equal((await route.POST(req({action:'create'},'https://evil.invalid'))).status,403);
assert.equal((await route.POST(req({},'https://example.invalid','text/plain'))).status,415);
actor=null;assert.equal((await route.POST(req({}))).status,401);actor='a';
for(const body of [{action:'create',expectedActorId:'b',consent:true},{action:'create',expectedActorId:'a'},{action:'create',expectedActorId:'a',consent:true,customer_id:'cus_live'}])assert.equal((await route.POST(req(body))).status,400);
assert.equal(queries,0);assert.equal(providerCalls,0);
assert.equal((await route.POST(req({action:'create',expectedActorId:'a',consent:true}))).status,200);
assert.ok(operations.some(([k,v])=>k==='owner_id'&&v==='a'));assert.equal(providerCalls,1);
console.log('PASS route origin, content type, auth, owner mismatch, consent, unknown fields and owner-scoped creation. Fixture dependencies, no provider verification.');
})().catch(e=>{console.error(e);process.exitCode=1;});
