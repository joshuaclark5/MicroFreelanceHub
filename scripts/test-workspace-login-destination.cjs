const fs=require('fs'),vm=require('vm'),ts=require('typescript'),assert=require('assert/strict');
const source=fs.readFileSync('app/auth/callback/route.ts','utf8');
const exportsObject={};let signedIn=true;
const mocks={
 '@supabase/auth-helpers-nextjs':{createRouteHandlerClient:()=>({auth:{exchangeCodeForSession:async()=>({}),getUser:async()=>({data:{user:signedIn?{id:'fixture'}:null}})}})},
 '@supabase/supabase-js':{createClient:()=>({})},'next/headers':{cookies:()=>({})},
 'next/server':{NextResponse:{redirect:url=>url}},'../../lib/profileAttribution':{persistFirstTouch:async()=>{}}
};
vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:exportsObject,URL,URLSearchParams,process:{env:{}},console,require:n=>{assert.ok(n in mocks);return mocks[n];}});
(async()=>{
 for(const [query,path]of [['next=/workspace/setup','/workspace/setup'],['next=/workspace/setup&plan=pro','/checkout-plan'],['next=/workspace/setup&template=example','/signup-success'],['next=/workspace/evil','/signup-success'],['next=/workspace','/workspace'],['next=https://outside.invalid','/signup-success'],['next=//outside.invalid','/signup-success'],['next=/workspace&plan=pro','/checkout-plan'],['next=/workspace&template=example','/signup-success'],['','/signup-success']]){
 const url=await exportsObject.GET({url:'https://fixture.invalid/auth/callback?'+query});assert.equal(url.origin,'https://fixture.invalid');assert.equal(url.pathname,path);
 }
 signedIn=false;assert.equal((await exportsObject.GET({url:'https://fixture.invalid/auth/callback?next=/workspace'})).pathname,'/login');
 console.log('PASS 11 workspace login destination cases; external redirects rejected, plan/template priority retained. Mocked auth only.');
})().catch(e=>{console.error(e);process.exitCode=1;});
