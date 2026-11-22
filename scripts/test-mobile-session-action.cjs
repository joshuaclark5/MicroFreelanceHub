const fs=require('fs'),vm=require('vm'),ts=require('typescript'),assert=require('assert/strict');
const exportsObject={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('mobile/src/sessionAction.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports:exportsObject,Error});
(async()=>{
 const {sessionAction}=exportsObject;
 for(const transition of ['unchanged','other-account','signed-out','same-account-new-session']) {
  let epoch=1, actor='a', reject, messages=[];
  const capturedActor=actor,capturedEpoch=epoch;
  const task=sessionAction(()=>new Promise((_,r)=>reject=r),()=>actor===capturedActor&&epoch===capturedEpoch,m=>messages.push(m));
  if(transition==='other-account'){actor='b';epoch++;}
  if(transition==='signed-out'){actor=null;epoch++;}
  if(transition==='same-account-new-session')epoch++;
  reject(Error('Save was not confirmed'));await task;
  assert.deepEqual(messages,transition==='unchanged'?['Save was not confirmed']:[]);
 }
 let messages=[];
 await sessionAction(async()=>{throw Error('Sign-in failed');},()=>true,m=>messages.push(m));
 assert.deepEqual(messages,['Sign-in failed']);
 await sessionAction(async()=>{},()=>true,()=>assert.fail('Success must not report failure'));
 console.log('Session-scoped mobile feedback tests passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
