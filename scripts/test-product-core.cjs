const fs=require('fs'),vm=require('vm'),ts=require('typescript'),assert=require('assert/strict'),path=require('path');
function load(file,imports={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,require:n=>{if(n in imports)return imports[n];throw Error('Unexpected import '+n);},Date,Number,Error,Map,BigInt,Intl,URLSearchParams});return exports;}
const privacy=load('app/lib/analyticsPrivacy.ts');
for(const p of ['/','/pricing','/articles/weekly-freelance-project-review-checklist','/create'])assert.equal(privacy.publicAnalyticsPath(p),p);
for(const p of ['/login','/dashboard','/workspace/clients','/book/abc','/sow/abc','/auth/callback','/create?token=secret','//evil.test','/articles/a?email=test'])assert.equal(privacy.publicAnalyticsPath(p),null);
assert.equal(privacy.analyticsAllowed({doNotTrack:'1'}),false);assert.equal(privacy.analyticsAllowed({globalPrivacyControl:true}),false);assert.equal(privacy.analyticsAllowed({}),true);
const time=load('app/lib/workspaceTime.ts');
const mobile=load('mobile/src/workflow.ts',{'../../app/lib/workspaceTime':time});
const actor='11111111-1111-4111-8111-111111111111',operation='22222222-2222-4222-8222-222222222222',project='33333333-3333-4333-8333-333333333333';
const p=mobile.manualTime(actor,operation,project,'45','Review draft',Date.parse('2026-11-21T15:00:00Z'));
assert.equal(p.seconds,2700);assert.equal(p.startedAt,'2026-11-21T14:15:00Z');assert.equal(p.billable,false);assert.equal(p.rateMinor,0);
for(const minutes of ['0','-1','1.5','1441','1e2',''])assert.throws(()=>mobile.manualTime(actor,operation,project,minutes,'',Date.now()));
assert.throws(()=>mobile.manualTime(actor,operation,'wrong','1','',Date.now()));
(async()=>{
 let calls=0,stored;
 const db={auth:{getUser:async()=>({data:{user:{id:actor}},error:null})},rpc:async(name,args)=>{calls++;assert.equal(name,'workspace_time_mutate');if(stored)assert.equal(args.payload.operationId,stored.operationId);stored=args.payload;return {data:{id:'saved'},error:null};}};
 await mobile.saveTime(db,p);await mobile.saveTime(db,p);assert.equal(calls,2);assert.equal(stored.operationId,operation);
 const wrong={...db,auth:{getUser:async()=>({data:{user:{id:project}},error:null})}};
 await assert.rejects(()=>mobile.saveTime(wrong,p),/session changed/);assert.equal(calls,2);
 // A prior RPC can succeed while its response is lost. A failed identity check
 // on retry must not claim that nothing was saved or issue another mutation.
 for(const getUser of [async()=>({data:{user:null},error:{message:'offline'}}),async()=>{throw Error('network failed');}]){
  const unavailable={...db,auth:{getUser}};
  await assert.rejects(()=>mobile.saveTime(unavailable,p),e=>/earlier save may already have succeeded/.test(e.message)&&!/no time was saved/.test(e.message));
  assert.equal(calls,2);
 }
 await assert.rejects(()=>mobile.saveTime(wrong,p),/earlier save may already have succeeded/);
 assert.equal(calls,2);
 const failed={...db,rpc:async()=>({error:{message:'internal error'}})};await assert.rejects(()=>mobile.saveTime(failed,p),/not confirmed/);
 const article=load('app/data/weeklyProjectReview.ts').weeklyProjectReview;assert.equal(article.slug,'weekly-freelance-project-review-checklist');assert.ok(article.sections.length>=6);assert.ok(article.sections.flatMap(s=>s.body).join(' ').split(/\s+/).length>700);
 console.log('PASS analytics route/privacy boundaries; native manual-time validation, account switch, stable retry ID and uncertain-save error; original article structure.');
})().catch(e=>{console.error(e);process.exitCode=1;});
