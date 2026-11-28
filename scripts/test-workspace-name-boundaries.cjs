const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),assert=require('node:assert/strict');
function load(path,mocks={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,URL,require:n=>{assert.ok(n in mocks,n);return mocks[n];}});return exports;}
const zones=load('app/lib/businessTimezone.ts'),pref=load('app/lib/workspaceExperience.ts',{'./workspaceInvoices':load('app/lib/workspaceInvoices.ts',{}),'./businessTimezone':zones});
let writes=0;
const user={id:'synthetic-owner',user_metadata:{unrelated:'preserved'}};
const route=load('app/api/workspace-preferences/route.ts',{
 '../../lib/workspaceExperience':pref,'next/headers':{cookies:()=>({})},
 'next/server':{NextResponse:{json:(body,options)=>({body,...options})}},
 '@supabase/auth-helpers-nextjs':{createRouteHandlerClient:()=>({auth:{getUser:async()=>({data:{user}}),updateUser:async({data})=>{writes++;Object.assign(user.user_metadata,data);return {data:{user}};}}})}
});
// Supply the URL global used by the real route without network or credentials.
// The loader only executes TypeScript source and mocked provider methods.
const base={profession:'Consulting',goal:'clients'};
let checks=0;
for(const [input,expected] of [['A','A'],['  Studio  ','Studio'],['\u00a0Studio\ufeff','Studio'],['A'.repeat(100),'A'.repeat(100)],['A'.repeat(101),'A'.repeat(101)],['A'.repeat(120),'A'.repeat(120)],[' '+ 'A'.repeat(120)+' ','A'.repeat(120)],['😀'.repeat(60),'😀'.repeat(60)],['',null],[' \n\t',null],['A'.repeat(121),null],['😀'.repeat(60)+'A',null],[null,null],[42,null]]){
 const inputObject={...base,business:input},before=JSON.stringify(inputObject);
 assert.equal(pref.workspacePreferences(inputObject)?.business??null,expected);
 assert.equal(JSON.stringify(inputObject),before);checks++;
}
const request=(business,expectedOwner=user.id)=>new Request('https://fixture.invalid/api/workspace-preferences',{method:'POST',headers:{origin:'https://fixture.invalid','content-type':'application/json'},body:JSON.stringify({expectedOwner,preferences:{...base,business}})});
(async()=>{
 const name='A'.repeat(120);
 let result=await route.POST(request(' '+name+' '));
 assert.equal(result.status,200);assert.equal(result.body.preferences.business,name);assert.equal(user.user_metadata.mfh_workspace.business,name);assert.equal(writes,1);checks++;
 const snapshot=JSON.stringify(user.user_metadata);
 for(const [business,owner,status] of [[name+'A',user.id,400],['  ',user.id,400],[name,'other-owner',409]]){
  result=await route.POST(request(business,owner));assert.equal(result.status,status);assert.equal(writes,1);assert.equal(JSON.stringify(user.user_metadata),snapshot);checks++;
 }
 assert.equal(user.user_metadata.unrelated,'preserved');
 result=await route.GET(new Request('https://fixture.invalid/api/workspace-preferences'));
 assert.equal(result.body.preferences.business,name);checks++;
 console.log(`PASS ${checks} business-name boundary/readback groups (mocked provider; no hosted writes).`);
})().catch(e=>{console.error(e);process.exitCode=1;});
