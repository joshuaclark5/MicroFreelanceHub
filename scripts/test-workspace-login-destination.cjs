const fs=require('fs'),vm=require('vm'),ts=require('typescript'),assert=require('assert/strict');
const source=fs.readFileSync('app/auth/callback/route.ts','utf8');
const exportsObject={};let signedIn=true;
const destinationExports={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/lib/authDestination.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:destinationExports,Set});
const mocks={
 '../../lib/authDestination':destinationExports,
 '@supabase/auth-helpers-nextjs':{createRouteHandlerClient:()=>({auth:{exchangeCodeForSession:async()=>({}),getUser:async()=>({data:{user:signedIn?{id:'fixture'}:null}})}})},
 '@supabase/supabase-js':{createClient:()=>({})},'next/headers':{cookies:()=>({})},
 'next/server':{NextResponse:{redirect:url=>url}},'../../lib/profileAttribution':{persistFirstTouch:async()=>{}}
};
vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:exportsObject,URL,URLSearchParams,process:{env:{}},console,require:n=>{assert.ok(n in mocks);return mocks[n];}});
(async()=>{
 for(const [query,path]of [['next=/workspace/setup','/workspace/setup'],['next=/workspace/setup&plan=pro','/checkout-plan'],['next=/workspace/setup&template=example','/signup-success'],['next=/workspace/evil','/signup-success'],['next=/workspace','/workspace'],['next=https://outside.invalid','/signup-success'],['next=//outside.invalid','/signup-success'],['next=/workspace&plan=pro','/checkout-plan'],['next=/workspace&template=example','/signup-success'],['returnTo=/workspace/clients','/workspace/clients'],['returnTo=/workspace/setup','/workspace/setup'],['returnTo=/workspace/projects','/workspace/projects'],['next=/workspace/tasks','/workspace/tasks'],['next=/workspace/../login','/signup-success'],['next=/workspace?next=https://outside.invalid','/signup-success'],['next=/workspace%5Cevil','/signup-success'],['next=//outside.invalid&returnTo=/workspace','/signup-success'],['returnTo=https://outside.invalid','/signup-success'],['','/signup-success']]){
 const url=await exportsObject.GET({url:'https://fixture.invalid/auth/callback?'+query});assert.equal(url.origin,'https://fixture.invalid');assert.equal(url.pathname,path);
 }
 for(const section of ['clients','projects','stages','tasks','agreements','time','team','scheduling','resources','reports','invoices','crm','connections']) {
  const path='/workspace/'+section;
  assert.equal(destinationExports.getAuthDestination(new URLSearchParams({next:path})),path);
  assert.equal(destinationExports.getAuthDestination(new URLSearchParams({returnTo:path})),path);
 }
 for(const goal of ['clients','projects','agreements','scheduling','time','invoices']) {
  const next='/workspace/setup?goal='+goal;
  assert.equal(destinationExports.getAuthDestination(new URLSearchParams({next})),next);
  const result=await exportsObject.GET({url:'https://fixture.invalid/auth/callback?'+new URLSearchParams({next})});
  assert.equal(result.pathname+result.search,next);
 }
 for(const next of ['/workspace/setup?edit=1','/workspace/setup?goal=time'])assert.equal(destinationExports.getAuthDestination(new URLSearchParams({next})),next);
 for(const next of ['/workspace/setup?goal=evil','/workspace/setup?goal=time&next=//outside.invalid','/workspace/setup?edit=2','/workspace/setup?goal=%74ime'])assert.equal(destinationExports.getAuthDestination(new URLSearchParams({next})),null);
 signedIn=false;assert.equal((await exportsObject.GET({url:'https://fixture.invalid/auth/callback?next=/workspace'})).pathname,'/login');
 const login=fs.readFileSync('app/login/page.tsx','utf8');
 for(const target of ['redirectUrl.searchParams','params','callbackUrl.searchParams'])assert.ok(login.includes("if (destination) "+target+".set('next', destination)"));
 console.log('PASS workspace destinations, legacy returnTo, unsafe redirect rejection, plan/template priority and Google/email confirmation wiring. Mocked auth only.');
})().catch(e=>{console.error(e);process.exitCode=1;});
