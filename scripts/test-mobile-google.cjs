const fs=require('fs'),vm=require('vm'),ts=require('typescript'),assert=require('node:assert/strict');
const exportsObject={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('mobile/src/googleSignIn.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:exportsObject,URL,Error});
const {GOOGLE_CALLBACK,googleCallbackCode,googleSignIn}=exportsObject;
assert.equal(googleCallbackCode(GOOGLE_CALLBACK+'?code=fixture'),'fixture');
for(const url of ['https://evil.test/auth/callback?code=x','microfreelancehub://other/callback?code=x',GOOGLE_CALLBACK+'?code=a&code=b',GOOGLE_CALLBACK+'?code=',GOOGLE_CALLBACK+'?error=denied&code=x',GOOGLE_CALLBACK+'#access_token=secret',GOOGLE_CALLBACK+'?code=x#refresh_token=secret',GOOGLE_CALLBACK])assert.throws(()=>googleCallbackCode(url));
async function run(options={}){
 let opened=0,exchanged=0,request;
 const db={auth:{signInWithOAuth:async value=>{request=value;return {data:{url:options.authorize||'https://fixture.supabase.co/auth/v1/authorize?provider=google&code_challenge_method=s256&code_challenge=fixture'}};},exchangeCodeForSession:async code=>{exchanged++;assert.equal(code,'fixture');return options.exchangeError?{error:{message:'private'}}:{data:{session:{user:{id:'existing-user'}}}};}}};
 let error,result;try{result=await googleSignIn(db,'https://fixture.supabase.co',async()=>{opened++;return options.browser||{type:'success',url:GOOGLE_CALLBACK+'?code=fixture'};});}catch(e){error=e;}
 return {opened,exchanged,request,error,result};
}
(async()=>{
 const success=await run();assert.equal(success.result,true);assert.equal(success.request.provider,'google');assert.equal(success.request.options.skipBrowserRedirect,true);assert.equal(success.exchanged,1);
 for(const type of ['cancel','dismiss']){const x=await run({browser:{type}});assert.equal(x.result,false);assert.equal(x.exchanged,0);}
 for(const authorize of ['https://evil.test/auth/v1/authorize','http://fixture.supabase.co/auth/v1/authorize','https://fixture.supabase.co/other']){const x=await run({authorize});assert.ok(x.error);assert.equal(x.opened,0);}
 for(const authorize of ['https://fixture.supabase.co/auth/v1/authorize?code_challenge=x&code_challenge_method=plain','https://fixture.supabase.co/auth/v1/authorize?code_challenge_method=s256']){const x=await run({authorize});assert.ok(x.error);assert.equal(x.opened,0);}
 const bad=await run({browser:{type:'success',url:'https://evil.test/?code=fixture'}});assert.ok(bad.error);assert.equal(bad.exchanged,0);
 const failed=await run({exchangeError:true});assert.ok(failed.error);assert.equal(failed.error.message.includes('private'),false);
 console.log('PASS Google OAuth helper: trusted authorization origin, exact callback, no fragment tokens, duplicate/missing-code rejection, cancel, PKCE exchange and safe provider failure (mocked).');
})().catch(e=>{console.error(e);process.exitCode=1});
