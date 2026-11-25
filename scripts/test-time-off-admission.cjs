// Isolated local admission proof. No hosted requests or existing database changes.
const fs=require('node:fs'),cp=require('node:child_process'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const vm=require('node:vm'),ts=require('typescript');
function load(file,mocks={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,Intl,Date,Set,require:n=>{assert.ok(n in mocks);return mocks[n];}});return exports;}
const scheduling=load('app/lib/workspaceScheduling.ts');
const {timeOffResult}=load('app/lib/workspaceTimeOff.ts',{'./workspaceScheduling':scheduling});
const releaseCandidate=process.env.QA_TIME_OFF_RELEASE_CANDIDATE==='1';
const names=releaseCandidate?JSON.parse(fs.readFileSync('scripts/workspace-review/global-time-off-release-names.json','utf8')):{};
const rename=sql=>releaseCandidate?sql.replace(new RegExp(Object.keys(names).sort((a,b)=>b.length-a.length).join('|'),'g'),key=>names[key]):sql;
const container='mfh-recurrence-restore-20261124',database=(releaseCandidate?'time_off_release_':'time_off_prototype_')+Date.now(),out=releaseCandidate?'artifacts/time-off-release-candidate':'artifacts/time-off-admission';fs.mkdirSync(out,{recursive:true});
const json=v=>"'"+JSON.stringify(v).replaceAll("'","''")+"'::jsonb";
function query(sql){return new Promise(resolve=>{const p=cp.spawn('docker',['exec','-i',container,'psql','-U','supabase_admin','-d',database,'-At','-v','ON_ERROR_STOP=1'],{windowsHide:true});let stdout='',stderr='';p.stdout.on('data',b=>stdout+=b);p.stderr.on('data',b=>stderr+=b);const timer=setTimeout(()=>p.kill(),60000);p.on('exit',code=>{clearTimeout(timer);resolve({code,stdout,stderr});});p.stdin.end(rename(sql));});}
async function ok(sql){const r=await query(sql);assert.equal(r.code,0,r.stderr);return r.stdout;}
const actor=()=>crypto.randomUUID();
const auth=id=>`set role authenticated;select set_config('request.jwt.claim.sub','${id}',false);`;
const request=(id,body)=>auth(id)+`select public.prototype_time_off_request(${json(body)});`;
const objects=s=>s.split(/\r?\n/).filter(v=>v.startsWith('{')).map(JSON.parse);
const call=async(id,body)=>objects(await ok(request(id,body)))[0];
(async()=>{
 const isolated=cp.spawnSync('docker',['inspect','--format','{{.HostConfig.NetworkMode}} {{json .HostConfig.PortBindings}}',container],{encoding:'utf8'});assert.equal(isolated.status,0);assert.equal(isolated.stdout.trim(),'none {}');
 const clone=cp.spawnSync('docker',['exec',container,'createdb','-U','supabase_admin',...(releaseCandidate?['-O','postgres']:[]),'-T','staging_recurrence',database],{encoding:'utf8'});assert.equal(clone.status,0,clone.stderr);
 if(releaseCandidate)await ok(fs.readFileSync('scripts/workspace-review/global-time-off-release-candidate.sql','utf8'));
 else for(const file of ['global-time-off-prototype.sql','global-time-off-lifecycle-prototype.sql','global-time-off-admission-prototype.sql'])await ok(fs.readFileSync('scripts/workspace-review/'+file,'utf8').replace(/^\uFEFF/,''));
 const A=actor(),B=actor(),C=actor(),D=actor();await ok(`insert into auth.users(id) values('${A}'),('${B}'),('${C}'),('${D}');`);
 const preview=id=>({action:'preview',expectedActorId:id,startsOn:'2027-01-01',endsOn:'2027-01-05',timezone:'UTC'});
 const first=await call(A,preview(A));assert.equal(first.ok,true);assert.equal(first.actorId,A);assert.equal(first.preview.affectedBookings.length,0);assert.equal(timeOffResult(first,preview(A),A).preview.affectedBookings.length,0);
 const create={...preview(A),action:'create',operationId:actor(),expectedReviewToken:first.preview.reviewToken};
 const saved=await call(A,create);assert.equal(saved.ok,true);assert.equal(saved.replayed,false);assert.equal(timeOffResult(saved,create,A).record.id,saved.record.id);
 const retry=await call(A,create);assert.equal(retry.replayed,true);assert.equal(retry.record.id,saved.record.id);
 const listBody={...preview(A),action:'list'};
 const listed=await call(A,listBody);assert.equal(listed.records.length,1);assert.equal(listed.records[0].id,saved.record.id);assert.equal(listed.truncated,false);assert.equal(timeOffResult(listed,listBody,A).records.length,1);
 const boundary=await call(A,{...listBody,startsOn:'2026-12-31',endsOn:'2026-12-31'});assert.equal(boundary.records.length,0);
 const overlap=await call(A,{...listBody,startsOn:'2026-12-31',endsOn:'2026-12-31',timezone:'America/Los_Angeles'});assert.equal(overlap.records.length,1);
 assert.equal((await call(A,{...listBody,startsOn:'2027-01-01',endsOn:'2028-01-02'})).code,'invalid');
 assert.equal((await call(A,{...listBody,expectedActorId:B})).code,'invalid');
 const changed=await call(A,{...create,endsOn:'2027-01-06'});assert.deepEqual(changed,{ok:false,code:'conflict'});
 const stale=await call(A,{...create,operationId:actor(),expectedReviewToken:'a'.repeat(64)});assert.deepEqual(stale,{ok:false,code:'review_changed'});
 const removeBody={action:'remove',expectedActorId:A,operationId:actor(),id:saved.record.id,expectedVersion:1};const removed=await call(A,removeBody);assert.equal(removed.ok,true);assert.equal(removed.record.active,false);assert.equal(removed.record.version,2);assert.equal(timeOffResult(removed,removeBody,A).record.active,false);assert.equal((await call(A,listBody)).records.length,0);
 // Repeated failures are separate autocommitted RPCs, as with PostgREST.
 const bad={action:'unsupported',expectedActorId:B};const batch=objects(await ok(auth(B)+Array.from({length:33},()=>`select prototype_time_off_request(${json(bad)});`).join('\n')));assert.equal(batch.length,33);assert.ok(batch.slice(0,30).every(r=>r.code==='invalid'));assert.ok(batch.slice(30).every(r=>r.code==='rate_limited'));
 assert.equal((await ok(`select hits from prototype_time_off_limits where owner_id='${B}';`)).trim(),'31');
 assert.equal((await call(A,preview(A))).ok,true,'Other owner quota independent');
 await ok(`update prototype_time_off_limits set expires_at=clock_timestamp()-interval '1 second' where owner_id='${B}';`);assert.equal((await call(B,bad)).code,'invalid');assert.equal((await ok(`select hits from prototype_time_off_limits where owner_id='${B}';`)).trim(),'1');
 // Actual concurrent connections cannot oversubscribe the owner admission cap.
 const race=await Promise.all(Array.from({length:34},()=>call(C,{action:'unsupported',expectedActorId:C})));assert.equal(race.filter(r=>r.code==='invalid').length,30);assert.equal(race.filter(r=>r.code==='rate_limited').length,4);
 // Failure AFTER creating a closure but before returning a receipt must undo work,
 // while the outside counter persists. Test trigger exists only in this clone.
 const review=await call(D,preview(D));
 await ok(`create function public.prototype_receipt_fail() returns trigger language plpgsql as $$ begin raise exception using errcode='XX000',message='private synthetic failure';end $$;create trigger prototype_receipt_fail after insert on prototype_time_off_operations for each row execute function public.prototype_receipt_fail();`);
 const failed=await call(D,{...preview(D),action:'create',operationId:actor(),expectedReviewToken:review.preview.reviewToken});assert.deepEqual(failed,{ok:false,code:'unavailable'});assert.ok(!JSON.stringify(failed).includes('private'));
 assert.equal((await ok(`select count(*) from prototype_time_off where owner_id='${D}';`)).trim(),'0');assert.equal((await ok(`select count(*) from prototype_time_off_operations where owner_id='${D}';`)).trim(),'0');assert.equal((await ok(`select hits from prototype_time_off_limits where owner_id='${D}';`)).trim(),'2');await ok('drop trigger prototype_receipt_fail on prototype_time_off_operations;');
 for(const sql of [`set role anon;select prototype_time_off_request('{}');`,auth(A)+`select prototype_time_off_mutate(${json(create)});`,auth(A)+'select * from prototype_time_off_limits;',auth(A)+'select * from prototype_time_off_operations;'])assert.notEqual((await query(sql)).code,0);
 assert.deepEqual(objects(await ok("set role authenticated;select prototype_time_off_request('{}');"))[0],{ok:false,code:'invalid'});
 // Synthetic dense active list, plus inactive and other-owner rows.
 const E=actor(),F=actor();await ok(`insert into auth.users(id) values('${E}'),('${F}');insert into prototype_time_off(owner_id,starts_on,ends_on,timezone,starts_at,ends_at,active) select '${E}','2027-01-01','2027-01-01','UTC','2027-01-01T00:00:00Z','2027-01-02T00:00:00Z',true from generate_series(1,102);insert into prototype_time_off(owner_id,starts_on,ends_on,timezone,starts_at,ends_at,active) values('${E}','2027-01-01','2027-01-01','UTC','2027-01-01T00:00:00Z','2027-01-02T00:00:00Z',false),('${F}','2027-01-01','2027-01-01','UTC','2027-01-01T00:00:00Z','2027-01-02T00:00:00Z',true);`);
 const denseBody={...preview(E),action:'list'},dense=await call(E,denseBody);assert.equal(dense.records.length,100);assert.equal(dense.truncated,true);assert.ok(dense.records.every(r=>r.owner_id===E&&r.active));const projection=timeOffResult(dense,denseBody,E);assert.equal(projection.truncated,true);assert.ok(!JSON.stringify(projection).includes('owner_id'));
 const repeated=await call(E,denseBody);assert.deepEqual(repeated.records.map(r=>r.id),dense.records.map(r=>r.id));
 const otherList=await call(F,{...preview(F),action:'list'});assert.equal(otherList.records.length,1);assert.equal(otherList.truncated,false);
 const result={passed:true,releaseCandidate,at:new Date().toISOString(),database,network:'none',hostedChanges:false,checks:['authenticated wrapper success/replay/removal and actual API response-contract parity','structured conflict/review errors','failed requests consume durable quota','30/minute cap with saturated counters','owner isolation and expiry reset','34 concurrent direct calls:30 admitted/4 limited','post-insert exception rolls back closure and receipt but preserves quota','anonymous/internal-function/private-table access denied','range list: half-open boundaries, timezone overlap, removed exclusion, owner isolation, stable100-row cap with explicit truncation'],remaining:['hosted migration/config review and independent readback','full HTTP/database staging integration','owner UI and list API','boundary performance and release verification']};fs.writeFileSync(out+'/result.json',JSON.stringify(result,null,2));console.log('PASS local durable admission proof. '+database);
})().catch(e=>{fs.writeFileSync(out+'/failure.txt',e.stack);console.error(e);process.exitCode=1;});
