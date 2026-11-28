const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('app/workspace/setup/page.tsx','utf8');
const handler=source.slice(source.indexOf('async function save('),source.indexOf(' const selected='));
const ts=require('typescript');
const parserSource=fs.readFileSync('app/lib/workspaceExperience.ts','utf8');
const zoneExports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/lib/businessTimezone.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:zoneExports});
const exportsObject={};vm.runInNewContext(ts.transpileModule(parserSource,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:exportsObject,URL,require:n=>{assert.equal(n,"./businessTimezone");return zoneExports;}});
function fixture(){
 const events=[],writes=[];let release;
 const context={business:'  Synthetic workspace  ',profession:'Technology',goal:'clients',timezone:'UTC',details:{},businessDetailErrors:exportsObject.businessDetailErrors,setFieldErrors:()=>{},requestedGoal:'',owner:{current:'owner-test'},generation:{current:1},saving:{current:false},goals:[{id:'clients',href:'/workspace/clients'}],workspacePreferences:exportsObject.workspacePreferences,JSON,Error,
 setError:v=>events.push(['error',v]),setStep:v=>events.push(['step',v]),setBusy:v=>events.push(['busy',v]),setSaved:v=>events.push(['saved',v]),router:{replace:v=>events.push(['navigate',v])},
 fetch:(_url,opts)=>{writes.push(JSON.parse(opts.body));return new Promise(resolve=>{release=resolve;});}};
 vm.createContext(context);vm.runInContext(ts.transpileModule(handler+';globalThis.runSave=save;',{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText,context);
 return {context,events,writes,reply:(status=200,owner='owner-test')=>release({ok:status===200,json:async()=>({ownerId:owner,preferences:{business:'Synthetic workspace',profession:'Technology',goal:'clients',timezone:'UTC'},error:status===200?undefined:'Synthetic failure'})})};
}
(async()=>{
 let f=fixture();let pending=f.context.runSave(true);await f.context.runSave(true);assert.equal(f.writes.length,1);assert.equal(f.events.some(e=>e[0]==='navigate'),false);f.reply();await pending;assert.deepEqual(f.events.filter(e=>e[0]==='navigate'),[['navigate','/workspace']]);assert.equal(f.context.saving.current,false);
 f=fixture();pending=f.context.runSave(true);f.reply(503);await pending;assert.equal(f.events.some(e=>e[0]==='navigate'),false);assert.equal(f.context.business,'  Synthetic workspace  ');assert.equal(f.context.saving.current,false);pending=f.context.runSave(true);f.reply();await pending;assert.equal(f.writes.length,2);
 f=fixture();pending=f.context.runSave(true);f.reply(200,'foreign-owner');await pending;assert.equal(f.events.some(e=>e[0]==='navigate'||e[0]==='saved'),false);
 f=fixture();pending=f.context.runSave(true);f.context.generation.current++;f.reply();await pending;assert.equal(f.events.some(e=>e[0]==='navigate'||e[0]==='saved'),false);
 f=fixture();f.context.business=' ';await f.context.runSave(true);assert.equal(f.writes.length,0);
 f=fixture();f.context.owner.current='';await f.context.runSave(true);assert.equal(f.writes.length,0);
 f=fixture();pending=f.context.runSave();f.reply();await pending;assert.deepEqual(f.events.filter(e=>e[0]==='saved'),[['saved',true]]);
 f=fixture();f.context.requestedGoal='clients';pending=f.context.runSave();f.reply();await pending;assert.deepEqual(f.events.filter(e=>e[0]==='navigate'),[['navigate','/workspace/clients']]);
 f=fixture();f.context.requestedGoal='clients';pending=f.context.runSave(true);f.reply();await pending;assert.deepEqual(f.events.filter(e=>e[0]==='navigate'),[['navigate','/workspace']]);
 console.log('PASS 9 setup-save handler groups: duplicate suppression, failure/retry/input retention, owner rejection, stale response, validation, missing owner, existing continuation, goal continuation, explicit exit. Actual source handler; mocked transport, not rendered browser proof.');
})().catch(e=>{console.error(e);process.exitCode=1;});
