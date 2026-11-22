const fs=require('fs'),vm=require('vm'),ts=require('typescript'),assert=require('assert/strict'),path=require('path');
function load(file,imports={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,require:n=>{if(n in imports)return imports[n];throw Error('Unexpected import '+n);},Date,Number,Error,Map,BigInt,Intl,URLSearchParams});return exports;}
const exit=load('mobile/src/sessionExit.ts');
assert.equal(exit.signOutWarning(false,false,'','  '),null);
for(const args of [[false,false,'10',''],[false,false,'','note'],[false,true,'','']])assert.equal(exit.signOutWarning(...args).title,'Discard this unsaved entry?');
assert.equal(exit.signOutWarning(true,true,'10','note').title,'A save is still uncertain');
assert.equal(exit.sameSession('a',1,'a',1),true);
assert.equal(exit.sameSession('a',1,'b',1),false);
assert.equal(exit.sameSession('a',1,'a',2),false);
assert.equal(exit.sameSession(null,1,null,1),false);
const privacy=load('app/lib/analyticsPrivacy.ts');
const handoff=load('app/lib/supportHandoff.ts');
const special='Save failed & retry?\nUnicode: café <script>alert(1)</script>';
const draft=handoff.supportDraft('Time tracking',special);
assert.equal(draft.subject,'MicroFreelanceHub help: Time tracking');
const params=new URLSearchParams(draft.href.split('?')[1]);
assert.ok(params.get('body').includes(special));
assert.equal([...params.keys()].sort().join(','),'body,subject');
assert.equal(handoff.supportDraft('Invalid\r\nBcc: attacker','').subject,'MicroFreelanceHub help: Something else');
assert.ok(!handoff.supportDraft('Account access','x'.repeat(1500)+'PRIVATE_TAIL').body.includes('PRIVATE_TAIL'));
for(const p of ['/','/pricing','/features','/articles/weekly-freelance-project-review-checklist','/create'])assert.equal(privacy.publicAnalyticsPath(p),p);
for(const p of ['/login','/dashboard','/workspace/clients','/book/abc','/sow/abc','/auth/callback','/create?token=secret','//evil.test','/articles/a?email=test'])assert.equal(privacy.publicAnalyticsPath(p),null);
assert.equal(privacy.analyticsAllowed({doNotTrack:'1'}),false);assert.equal(privacy.analyticsAllowed({globalPrivacyControl:true}),false);assert.equal(privacy.analyticsAllowed({}),true);
const browser=load('mobile/src/projectBrowser.ts');
const projects=[{id:'a',name:'Brand refresh'},{id:'b',name:'Client Portal'},{id:'c',name:'Caf? launch'}];
assert.equal(browser.filterProjects(projects,'  PORTAL  ')[0].id,'b');
assert.equal(browser.filterProjects(projects,'caf?')[0].id,'c');
assert.equal(browser.filterProjects(projects,'missing').length,0);
assert.equal(browser.filterProjects(projects,' '),projects);
const gate=browser.createLoadGate(), first=gate.begin(), second=gate.begin();
assert.equal(first.isCurrent(),false);assert.equal(second.isCurrent(),true);
gate.invalidate();assert.equal(second.isCurrent(),false);
const afterSwitch=gate.begin();assert.equal(afterSwitch.isCurrent(),true);
assert.equal(first.isCurrent(),false);
const time=load('app/lib/workspaceTime.ts');
const mobile=load('mobile/src/workflow.ts',{'../../app/lib/workspaceTime':time});
const actor='11111111-1111-4111-8111-111111111111',operation='22222222-2222-4222-8222-222222222222',project='33333333-3333-4333-8333-333333333333';
const p=mobile.manualTime(actor,operation,project,'45','Review draft',Date.parse('2026-11-21T15:00:00Z'));
assert.equal(p.seconds,2700);assert.equal(p.startedAt,'2026-11-21T14:15:00Z');assert.equal(p.billable,false);assert.equal(p.rateMinor,0);
for(const minutes of ['0','-1','1.5','1441','1e2',''])assert.throws(()=>mobile.manualTime(actor,operation,project,minutes,'',Date.now()));
assert.throws(()=>mobile.manualTime(actor,operation,'wrong','1','',Date.now()));
(async()=>{
 // Only explicit arrays confirm an empty workspace; incomplete responses must fail.
 function loadDb(projectData,entryData,queryError=null){
  return {auth:{getUser:async()=>({data:{user:{id:actor}},error:null})},from:table=>{
   const query={select:()=>query,eq:()=>query,not:()=>query,order:()=>query,
    limit:async()=>({data:table==='workspace_projects'?projectData:entryData,error:queryError})};
   return query;
  }};
 }
 const empty=await mobile.loadWork(loadDb([],[]),actor);
 assert.equal(empty.projects.length,0);assert.equal(empty.entries.length,0);
 for(const invalid of [null,undefined,{},'']){
  await assert.rejects(()=>mobile.loadWork(loadDb(invalid,[]),actor),/Could not load/);
  await assert.rejects(()=>mobile.loadWork(loadDb([],invalid),actor),/Could not load/);
 }
 await assert.rejects(()=>mobile.loadWork(loadDb([],[],{message:'private diagnostic'}),actor),/Could not load/);
 const loaded=await mobile.loadWork(loadDb(Array.from({length:201},(_,i)=>({id:String(i),name:'Project',status:'active'})),[{id:'entry'}]),actor);
 assert.equal(loaded.projects.length,200);assert.equal(loaded.projectsTruncated,true);assert.equal(loaded.entries[0].id,'entry');
 // Simulate responses completing out of order, including an account change.
 const responseGate=browser.createLoadGate();let rendered,resolveOld,resolveNew;
 const apply=async(promise)=>{const request=responseGate.begin();const value=await promise;if(request.isCurrent())rendered=value;};
 const oldLoad=apply(new Promise(resolve=>{resolveOld=resolve;}));
 const newLoad=apply(new Promise(resolve=>{resolveNew=resolve;}));
 resolveNew('new account-safe list');await newLoad;
 resolveOld('stale list');await oldLoad;assert.equal(rendered,'new account-safe list');
 let resolveDeparted;
 const departedLoad=apply(new Promise(resolve=>{resolveDeparted=resolve;}));
 responseGate.invalidate();rendered=undefined;resolveDeparted('previous account');await departedLoad;
 assert.equal(rendered,undefined);
 const receipt=p=>({id:operation,owner_id:p.expectedActorId,project_id:p.projectId,source:'manual',description:p.description,seconds:p.seconds,billable:p.billable,rate_minor:p.rateMinor,currency:p.currency,started_at:p.startedAt,stopped_at:new Date(Date.parse(p.startedAt)+p.seconds*1000).toISOString()});
 let calls=0,stored;
 const db={auth:{getUser:async()=>({data:{user:{id:actor}},error:null})},rpc:async(name,args)=>{calls++;assert.equal(name,'workspace_time_mutate');if(stored)assert.equal(args.payload.operationId,stored.operationId);stored=args.payload;return {data:receipt(args.payload),error:null};}};
 // Preparing/revising a review is local only; confirmation sends the exact reviewed payload.
 const reviewed=mobile.manualTime(actor,operation,project,'90','Reviewed note',Date.parse('2026-11-21T16:00:00Z'));
 assert.equal(calls,0);assert.equal(reviewed.seconds,5400);assert.equal(reviewed.description,'Reviewed note');
 assert.equal(reviewed.startedAt,'2026-11-21T14:30:00Z');
 let confirmedPayload;
 await mobile.saveTime({...db,rpc:async(_name,args)=>{confirmedPayload=args.payload;return {data:receipt(args.payload),error:null};}},reviewed);
 assert.equal(confirmedPayload,reviewed);assert.equal(confirmedPayload.billable,false);assert.equal(calls,0);
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
 // Lost or mismatched acknowledgements must never clear the pending entry.
 for(const invalid of [null,undefined,{},[],{...receipt(p),id:'bad'},...Object.keys(receipt(p)).filter(k=>k!=='id').map(k=>({...receipt(p),[k]:null})),{...receipt(p),owner_id:project},{...receipt(p),seconds:1},{...receipt(p),billable:true}]){
  await assert.rejects(()=>mobile.saveTime({...db,rpc:async()=>({data:invalid,error:null})},p),/not confirmed/);
 }
 await assert.rejects(()=>mobile.saveTime({...db,rpc:async()=>{throw Error('PRIVATE transport diagnostic');}},p),e=>/earlier save/.test(e.message)&&!e.message.includes('PRIVATE'));
 const offsetReceipt={...receipt(p),started_at:'2026-11-21T09:15:00-05:00'};
 assert.equal(mobile.confirmedTimeReceipt(offsetReceipt,p),true);
 // Recovery after a lost response still submits the original operation.
 await mobile.saveTime(db,p);assert.equal(stored.operationId,operation);
 const failed={...db,rpc:async()=>({error:{message:'internal error'}})};await assert.rejects(()=>mobile.saveTime(failed,p),/not confirmed/);
 const article=load('app/data/weeklyProjectReview.ts').weeklyProjectReview;assert.equal(article.slug,'weekly-freelance-project-review-checklist');assert.ok(article.sections.length>=6);assert.ok(article.sections.flatMap(s=>s.body).join(' ').split(/\s+/).length>700);
 console.log('PASS project search and stale/account-switch load rejection; analytics route/privacy boundaries; native manual-time validation, account switch, stable retry ID and uncertain-save error; original article structure.');
})().catch(e=>{console.error(e);process.exitCode=1;});

for (const input of ['broken\uD800', '\uDC00broken', 'x'.repeat(1499)+'\u{1F600}tail', '\u{1F600}'.repeat(1501)]) {
 const result=handoff.supportDraft('Something else',input);
 const encoded=new URL(result.href).searchParams.get('body');
 assert.equal(encoded,result.body);
 assert.ok(!result.body.split('\n\n')[1].includes('tail'));
}
assert.ok(handoff.supportDraft('Something else','x'.repeat(1499)+'\u{1F600}').body.includes('\u{1F600}'));
console.log('PASS support draft malformed Unicode and emoji truncation');

for (const [id,topic] of [['account-access','Account access'],['report-export','Reports'],['uncertain-time-save','Time tracking'],['integrations','Integrations'],['untrusted?token=private','Something else'],['__proto__','Something else']]) assert.equal(handoff.answerSupportTopic(id),topic);
assert.equal(handoff.supportDraft('Reports','Existing details').subject,'MicroFreelanceHub help: Reports');
console.log('PASS reviewed answer handoff topics and unknown/prototype fallback');

assert.equal(handoff.supportDraft('Reports','Short question').canOpenEmail,true);
for (const content of ['&'.repeat(700), '\u{1F600}'.repeat(700), '\u4E2D'.repeat(700)]) {
 const longDraft=handoff.supportDraft('Reports',content);
 assert.equal(longDraft.canOpenEmail,false);
 assert.ok(longDraft.body.includes(content));
 assert.ok(new URL(longDraft.href).searchParams.get('body').includes(content));
}
console.log('PASS encoded mailto length guard preserves complete multilingual drafts');

const baseLength=handoff.supportDraft('Reports','').href.length;
const encodedRoom=2000-baseLength;
const boundaryDetails='&'.repeat(Math.floor(encodedRoom/3))+'x'.repeat(encodedRoom%3);
assert.equal(handoff.supportDraft('Reports',boundaryDetails).href.length,2000);
assert.equal(handoff.supportDraft('Reports',boundaryDetails).canOpenEmail,true);
assert.equal(handoff.supportDraft('Reports',boundaryDetails+'x').canOpenEmail,false);
