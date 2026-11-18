'use strict';
// Disposable SQL integration proof only: no network/provider calls or deployed schema changes.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {randomUUID,randomBytes,createHash,createCipheriv}=require('node:crypto');
const {PGlite}=require(process.env.PGLITE_MODULE||'C:/Users/joshu/mfh-payment-sql-proof/node_modules/@electric-sql/pglite');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.OUT_DIR||path.join(root,'../evidence-email'));
fs.mkdirSync(out,{recursive:true});const dir=fs.mkdtempSync(path.join(out,'database-'));
const migrationNames=['20261118020000_workspace_scheduling.sql','20261118070000_workspace_team.sql','20261118100000_workspace_email.sql'];
const hash=x=>createHash('sha256').update(x).digest('hex');
const migrations=migrationNames.map(name=>({name,sql:fs.readFileSync(path.join(root,'supabase/migrations',name),'utf8')}));
const report={passed:false,engine:'file-backed PGlite',database:dir,migrations:migrations.map(x=>({name:x.name,sha256:hash(x.sql)})),checks:[],failures:[],limitations:['Fictional auth.users/auth.uid and non-superuser roles; not live JWT, getUser, PostgREST or Supabase verification.','PGlite serializes one backend; no independent-backend contention or provider/network verification.','Test-only administrator clock adjustments avoid sleeping; no production migrations or configuration touched.']};
let db,current;const [A,B,C,D,U]=Array.from({length:5},randomUUID),email=id=>id+'@fixture.invalid';
const q=(sql,args=[])=>db.query(sql,args);
async function actor(id=A,name='authenticated'){await db.exec('reset role');await q("select set_config('request.jwt.claim.sub',$1,false)",[id||'']);await db.exec('set role '+name);current=id;}
const service=()=>actor('','service_role');
const admin=()=>db.exec('reset role');
const payload=(action,extra={})=>({action,expectedActorId:current,operationId:randomUUID(),...extra});
const team=async(action,extra={})=>(await q('select public.team_mutate($1::jsonb) r',[JSON.stringify(payload(action,extra))])).rows[0].r;
const scheduling=async(action,extra={})=>(await q('select public.workspace_scheduling_mutate($1::jsonb) r',[JSON.stringify(payload(action,extra))])).rows[0].r;
const call=async(name,args=[]) => (await q('select public.workspace_email_'+name+'('+args.map((_,i)=>'$'+(i+1)).join(',')+') r',args)).rows[0].r;
const snapshot=(id=current)=>call('snapshot',[id,null]);
async function deny(fn,code='42501'){await assert.rejects(fn,e=>{if(code)assert.equal(e.code,code,e.message);return true;});}
async function check(name,fn){try{await fn();report.checks.push(name);console.log('PASS '+name);}catch(e){report.failures.push({name,message:e.message,code:e.code,detail:e.detail,where:e.where,internalQuery:e.internalQuery,stack:e.stack});console.error('FAIL '+name+': '+e.message);await admin();}}
// 32-byte base64url token => 43 plaintext bytes => 58 ciphertext characters, genuine AES-GCM shape.
function secret(){const token=randomBytes(32).toString('base64url'),iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',randomBytes(32),iv);const encrypted=Buffer.concat([cipher.update(token,'utf8'),cipher.final()]);return {token,tokenHash:hash(token),ciphertext:['v1','fixture',iv.toString('base64url'),encrypted.toString('base64url'),cipher.getAuthTag().toString('base64url')].join('.')};}
let workspace,otherWorkspace,rule,intake,slot=0;
async function invitation(issuer=A,recipient=D,role='member',scope=workspace){await actor(issuer);const s=secret(),r=await team('invite',{workspaceId:scope,email:email(recipient),role,tokenHash:s.tokenHash});return {...s,...r,issuer,recipient,workspace:scope};}
async function join(issuer,id,role='member'){const i=await invitation(issuer,id,role);await actor(id);await team('accept',{workspaceId:workspace,tokenHash:i.tokenHash});}
async function booking(){await actor(A);const starts=new Date(rule.start.getTime()+(slot++)*3600000);return scheduling('book',{availabilityId:rule.id,expectedVersion:1,intakeId:intake.id,startsAt:starts.toISOString(),attendee:'Fictional guest',answers:{q1:'Fixture only'},consented:true});}
const invitationArgs=(i,who=i.issuer,operation=randomUUID())=>[who,operation,'team-invitation.v1',i.inviteId,null,i.tokenHash,i.ciphertext,'transactional-email.v1'];
const bookingArgs=(b,who=A,operation=randomUUID())=>[who,operation,'booking-reminder.v1',b.id,email(D),null,null,'transactional-email.v1'];
async function enqueue(args){await service();return call('enqueue',args);}
async function row(id){await admin();return (await q('select * from workspace_email_outbox where id=$1',[id])).rows[0];}
async function isolate(){await admin();await db.exec("update workspace_email_outbox set created_at=now()-interval '2 hours';update workspace_email_outbox set next_attempt_at=now()+interval '2 days' where status in ('queued','retry');update workspace_email_rate set next_at=now()-interval '1 second';");}
async function due(id){await admin();await q("update workspace_email_outbox set next_attempt_at=now()-interval '1 second' where id=$1",[id]);await db.exec("update workspace_email_rate set next_at=now()-interval '1 second'");await service();}
async function lease(id){await due(id);const e=await call('claim');assert.equal(e.id,id);return e;}
async function sending(id){const e=await lease(id);const r=await call('begin',[id,e.lease_id]);assert.equal(r.status,'sending');return r;}
async function cancel(id,who=A){await actor(who);return call('cancel',[who,id]);}
const assertSafe=x=>{for(const k of ['token_hash','token_ciphertext','provider_id','payload_hash','lease_id','operation_id'])assert.ok(!JSON.stringify(x).includes(k),'Leaked '+k);};
(async()=>{try{
 db=new PGlite(dir);await db.exec("create role anon nologin nosuperuser nobypassrls;create role authenticated nologin nosuperuser nobypassrls;create role service_role nologin nosuperuser nobypassrls;create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth,public to anon,authenticated,service_role;grant execute on function auth.uid() to anon,authenticated,service_role;");
 for(const id of [A,B,C,D,U])await q('insert into auth.users values($1,$2,$3)',[id,email(id),id===U?null:new Date().toISOString()]);
 for(const m of migrations)await db.exec(m.sql);
 await actor(A);workspace=(await team('create',{name:'Fictional email studio'})).workspaceId;otherWorkspace=(await team('create',{name:'Other fictional studio'})).workspaceId;
 await join(A,B,'admin');await join(A,C,'member');await actor(A);
 const start=new Date();start.setUTCDate(start.getUTCDate()+3);start.setUTCHours(0,0,0,0);
 rule={...(await scheduling('availability',{title:'Fictional booking',timezone:'UTC',weekday:start.getUTCDay(),startMinute:0,endMinute:1440,duration:30,buffer:0,noticeHours:0,horizonDays:180,dailyCap:50})),start};
 intake=await scheduling('publish',{title:'Fixture intake',consent:'Fixture consent',fields:[{id:'q1',label:'Question',required:true}]});
 await check('forced RLS, closed table grants and fixed function search paths',async()=>{
  await admin();const t=(await q("select relrowsecurity,relforcerowsecurity from pg_class where relname in ('workspace_email_outbox','workspace_email_rate')")).rows;assert.equal(t.length,2);assert.ok(t.every(x=>x.relrowsecurity&&x.relforcerowsecurity));
  const f=(await q("select proname,prosecdef,proconfig from pg_proc where proname like 'workspace_email_%'")).rows;assert.equal(f.length,11);assert.ok(f.every(x=>x.proconfig.includes('search_path=pg_catalog, public')));assert.ok(f.filter(x=>x.proname!=='workspace_email_safe').every(x=>x.prosecdef));
  for(const name of ['anon','authenticated','service_role']){await actor(A,name);for(const table of ['workspace_email_outbox','workspace_email_rate'])for(const statement of ['select * from '+table,'insert into '+table+' default values','delete from '+table,'update '+table+' set '+(table.endsWith('rate')?'next_at=next_at':'status=status')])await deny(()=>q(statement));}
  await actor(A);await deny(()=>q("insert into workspace_email_rate values(true,now()) on conflict(id) do update set next_at=now()"));
 });
 await check('anon and authenticated cannot execute enqueue worker or internal helper RPCs',async()=>{
  for(const name of ['anon','authenticated']){await actor(A,name);for(const [fn,args] of [['enqueue',[A,randomUUID(),'booking-reminder.v1',randomUUID(),email(D),null,null,'transactional-email.v1']],['claim',[]],['begin',[randomUUID(),randomUUID()]],['finish',[randomUUID(),randomUUID(),'accepted','fixture',60]],['reconcile',[randomUUID(),'fixture','delivered']]])await deny(()=>call(fn,args));for(const fn of ['authorized','visible','safe'])await deny(()=>q('select workspace_email_'+fn+'(null::workspace_email_outbox)'));}
  await actor('','anon');await deny(()=>snapshot(A));await deny(()=>call('cancel',[A,randomUUID()]));await actor('');await deny(()=>snapshot(A));await actor(A);await deny(()=>snapshot(B));
 });
 let original,originalArgs;
 await check('owner enqueue needs explicit consent and matching token; safe result omits secrets',async()=>{
  const i=await invitation();originalArgs=invitationArgs(i);await service();for(const consent of [null,'','transactional-email.v0'])await deny(()=>call('enqueue',originalArgs.map((v,n)=>n===7?consent:v)),'22023');
  await deny(()=>call('enqueue',originalArgs.map((v,n)=>n===5?hash('wrong'):v)));for(const cipher of [null,'plaintext','v1.bad'])await deny(()=>call('enqueue',originalArgs.map((v,n)=>n===6?cipher:v)));
  original=await call('enqueue',originalArgs);assert.equal(original.status,'queued');assertSafe(original);const r=await row(original.id);assert.equal(r.token_hash,i.tokenHash);assert.equal(r.token_ciphertext,i.ciphertext);assert.ok(!JSON.stringify(r).includes(i.token));assert.equal(r.consent_version,'transactional-email.v1');assert.ok(r.consented_at);
 });
 await check('idempotent receipt, changed hash conflict and aggregate uniqueness',async()=>{
  await service();assert.deepEqual(await call('enqueue',originalArgs),original);const another=await invitation();await service();await deny(()=>call('enqueue',invitationArgs(another,A,originalArgs[1])),'40001');await deny(()=>call('enqueue',invitationArgs({...another,inviteId:originalArgs[3],tokenHash:originalArgs[5],ciphertext:originalArgs[6]})),'23505');
  const b=await booking(),args=bookingArgs(b),r=await enqueue(args);assert.deepEqual(await call('enqueue',args),r);await deny(()=>call('enqueue',args.map((v,n)=>n===4?email(C):v)),'40001');await cancel(r.id);await cancel(original.id);
 });
 await check('DB rechecks owner admin member outsider unverified and booking-owner authority',async()=>{
  const memberI=await invitation(),adminI=await invitation(A,D,'admin');
  for(const id of [C,D,U])await deny(()=>enqueue(invitationArgs(memberI,id)));
  await deny(()=>enqueue(invitationArgs(adminI,B)));const r=await enqueue(invitationArgs(memberI,B));assert.equal(r.status,'queued');await actor(A);assert.ok(!(await snapshot()).records.some(x=>x.id===r.id));await actor(B);assert.ok((await snapshot()).records.some(x=>x.id===r.id));assertSafe(await snapshot());await deny(()=>call('cancel',[A,r.id]));await actor(C);await deny(()=>call('cancel',[C,r.id]));await cancel(r.id,B);
  const b=await booking();await deny(()=>enqueue(bookingArgs(b,B)));const args=bookingArgs(b);await service();await deny(()=>call('enqueue',args.map((v,n)=>n===5?hash('not-null'):v)),'22023');await deny(()=>call('enqueue',args.map((v,n)=>n===4?'INVALID':v)),'23514');
 });
 await check('explicit cancellation erases ciphertext and blocks previously acquired lease',async()=>{
  await isolate();const i=await invitation(),r=await enqueue(invitationArgs(i)),l=await lease(r.id);const c=await cancel(r.id);assert.equal(c.status,'canceled');assert.deepEqual(await cancel(r.id),c);assert.equal((await row(r.id)).token_ciphertext,null);await service();assert.equal(await call('begin',[r.id,l.lease_id]),null);assert.equal(await call('claim'),null);
 });
 await check('revoked and accepted invitations cancel queued mail and prevent replay enqueue',async()=>{
  for(const mode of ['revoke','accept']){await isolate();const i=await invitation(),args=invitationArgs(i),r=await enqueue(args);if(mode==='revoke'){await actor(A);await team('revoke',{workspaceId:workspace,inviteId:i.inviteId});}else{await actor(D);await team('accept',{workspaceId:workspace,tokenHash:i.tokenHash});}
   await due(r.id);assert.equal(await call('claim'),null);assert.equal((await row(r.id)).status,'canceled');await deny(()=>enqueue(args));if(mode==='accept'){await actor(A);await team('remove',{workspaceId:workspace,userId:D});}}
 });
 await check('issuer role loss and sender role loss invalidate queued and leased mail',async()=>{
  await isolate();const issued=await invitation(B),issuedRow=await enqueue(invitationArgs(issued,A));const own=await invitation(A),ownRow=await enqueue(invitationArgs(own,B)),l=await lease(ownRow.id);
  await actor(A);await team('role',{workspaceId:workspace,userId:B,role:'member'});await actor(B);assert.ok(!(await snapshot()).records.some(x=>x.id===ownRow.id));await deny(()=>call('cancel',[B,ownRow.id]));await service();assert.equal(await call('begin',[ownRow.id,l.lease_id]),null);await due(issuedRow.id);assert.equal(await call('claim'),null);assert.equal((await row(issuedRow.id)).status,'canceled');assert.equal((await row(ownRow.id)).status,'canceled');await actor(A);await team('role',{workspaceId:workspace,userId:B,role:'admin'});
 });
 await check('booking cancellation after claim prevents send and subsequent enqueue',async()=>{
  await isolate();const b=await booking(),args=bookingArgs(b),r=await enqueue(args),l=await lease(r.id);await actor(A);await scheduling('cancel',{id:b.id,expectedVersion:1});await service();assert.equal(await call('begin',[r.id,l.lease_id]),null);assert.equal((await row(r.id)).status,'canceled');await deny(()=>enqueue(args));
 });
 await check('global one-second claim rate and lease fencing; expired leased work recovers without attempt',async()=>{
  await isolate();const i=await invitation(),r=await enqueue(invitationArgs(i));const j=await invitation(),r2=await enqueue(invitationArgs(j));const l=await lease(r.id);assert.equal(l.attempts,0);assert.ok(Date.parse(l.lease_until)>Date.now());assert.equal(await call('claim'),null);assert.equal(await call('begin',[r.id,randomUUID()]),null);
  await admin();await q("update workspace_email_outbox set lease_until=now()-interval '1 second' where id=$1",[r.id]);await service();assert.equal(await call('begin',[r.id,l.lease_id]),null);const next=await lease(r.id);assert.notEqual(next.lease_id,l.lease_id);assert.equal(next.attempts,0);assert.equal(await call('begin',[r.id,l.lease_id]),null);assert.equal((await call('begin',[r.id,next.lease_id])).attempts,1);assert.equal(await call('begin',[r.id,next.lease_id]),null);await deny(()=>call('finish',[r.id,l.lease_id,'retry',null,60]),'40001');await call('finish',[r.id,next.lease_id,'failed',null,60]);await cancel(r2.id);
 });
 await check('exponential backoff bounded Retry-After and maximum five attempts',async()=>{
  await isolate();const i=await invitation(),r=await enqueue(invitationArgs(i));for(let attempt=1;attempt<=5;attempt++){const e=await sending(r.id);assert.equal(e.attempts,attempt);const seconds=attempt===2?999999:-10;const finished=await call('finish',[r.id,e.lease_id,'retry',null,seconds]);const stored=await row(r.id);const delay=(new Date(stored.next_attempt_at)-new Date(stored.updated_at))/1000;const minimum=attempt===2?86400:60*2**attempt;assert.ok(delay>=minimum&&delay<minimum+30,'Backoff includes bounded positive jitter');assert.equal(finished.status,attempt===5?'failed':'retry');assert.equal(stored.token_ciphertext,attempt===5?null:i.ciphertext);assert.equal(stored.lease_id,null);
   await admin();await db.exec("update workspace_email_rate set next_at=now()-interval '1 second'");await service();assert.equal(await call('claim'),null);}
  await due(r.id);assert.equal(await call('claim'),null);assert.equal((await row(r.id)).attempts,5);
 });
 await check('explicit and crash unknown are terminal no-resend and erase token material',async()=>{
  for(const mode of ['explicit','crash']){await isolate();const i=await invitation(),r=await enqueue(invitationArgs(i)),e=await sending(r.id);if(mode==='explicit')await call('finish',[r.id,e.lease_id,'unknown',null,60]);else{await admin();await q("update workspace_email_outbox set lease_until=now()-interval '1 second' where id=$1",[r.id]);}
   await due(r.id);assert.equal(await call('claim'),null);const stored=await row(r.id);assert.equal(stored.status,'unknown');assert.equal(stored.attempts,1);assert.equal(stored.token_ciphertext,null);await service();assert.equal(await call('begin',[r.id,e.lease_id]),null);await deny(()=>call('finish',[r.id,e.lease_id,'retry',null,60]),'40001');await deny(()=>call('reconcile',[r.id,'unrecorded','delivered']),'40001');assert.equal(await call('claim'),null);}
 });
 let delivered,persistedArgs,persistedReceipt;
 await check('provider acceptance is not delivery; only matched service reconciliation confirms delivery',async()=>{
  await isolate();const b=await booking(),r=await enqueue(bookingArgs(b)),e=await sending(r.id);assert.ok(e.starts_at);assert.equal(e.timezone,'UTC');await deny(()=>call('finish',[r.id,e.lease_id,'delivered','fictional-provider',60]),'22023');await deny(()=>call('finish',[r.id,e.lease_id,'accepted',null,60]),'22023');const accepted=await call('finish',[r.id,e.lease_id,'accepted','fictional-provider',60]);assert.equal(accepted.status,'accepted');assert.equal((await row(r.id)).evidence_at,null);await actor(A);await deny(()=>call('reconcile',[r.id,'fictional-provider','delivered']));assertSafe(await snapshot());await service();await deny(()=>call('reconcile',[r.id,'wrong-provider','delivered']),'40001');await deny(()=>call('reconcile',[r.id,'fictional-provider','opened']),'40001');delivered=await call('reconcile',[r.id,'fictional-provider','delivered']);assert.equal(delivered.status,'delivered');assert.ok((await row(r.id)).evidence_at);await service();assert.deepEqual(await call('reconcile',[r.id,'fictional-provider','delivered']),delivered);assert.equal((await call('reconcile',[r.id,'fictional-provider','bounced'])).status,'delivered');
 });
 await check('cancel during sending cannot promise unsend; retry cancels while accepted evidence remains reconcilable',async()=>{
  for(const outcome of ['retry','accepted']){await isolate();const i=await invitation(),r=await enqueue(invitationArgs(i)),e=await sending(r.id);assert.equal((await cancel(r.id)).status,'sending');assert.equal((await row(r.id)).token_ciphertext,null);await service();const result=await call('finish',[r.id,e.lease_id,outcome,outcome==='accepted'?'canceled-flight':null,60]);assert.equal(result.status,outcome==='retry'?'canceled':'accepted');if(outcome==='accepted')assert.equal((await call('reconcile',[r.id,'canceled-flight','bounced'])).status,'bounced');}
 });
 await check('twenty per hour admission cap; idempotent replay free and aged records release capacity',async()=>{
  await admin();await db.exec("update workspace_email_outbox set created_at=now()-interval '2 hours'");let last,args;
  for(let n=0;n<20;n++){const i=await invitation();args=invitationArgs(i);last=await enqueue(args);}assert.deepEqual(await call('enqueue',args),last);const overflow=await invitation(),overflowArgs=invitationArgs(overflow);await service();await deny(()=>call('enqueue',overflowArgs),'54000');await admin();await q("update workspace_email_outbox set created_at=now()-interval '2 hours' where id=$1",[last.id]);persistedReceipt=await enqueue(overflowArgs);persistedArgs=overflowArgs;assert.equal(persistedReceipt.status,'queued');
 });
 await check('file-backed reopen preserves all available rows receipts and protected access',async()=>{
  await admin();const before=(await q('select * from workspace_email_outbox order by id')).rows;assert.ok(before.length>0);assert.ok(before.some(x=>x.status==='canceled'));await db.close();db=new PGlite(dir);assert.deepEqual((await q('select * from workspace_email_outbox order by id')).rows,before);await actor(A);assertSafe(await snapshot());await deny(()=>q('select * from workspace_email_outbox'));await service();if(delivered)assert.equal((await call('reconcile',[delivered.id,'fictional-provider','delivered'])).status,'delivered');await deny(()=>call('enqueue',originalArgs)); // team removal revoked outstanding invitations to that recipient.
  assert.deepEqual(await call('enqueue',persistedArgs),persistedReceipt);
  assert.ok((await row(original.id)).payload_hash);
 });

 await check('wall expired invitation and lease cannot begin in old transaction',async()=>{
  await isolate();const i=await invitation(),r=await enqueue(invitationArgs(i)),l=await lease(r.id);await admin();
  await q("update team_invites set expires_at=clock_timestamp()+interval '150 milliseconds' where id=$1",[i.inviteId]);
  await q("update workspace_email_outbox set lease_until=clock_timestamp()+interval '150 milliseconds' where id=$1",[r.id]);
  await service();await db.exec('begin');await new Promise(resolve=>setTimeout(resolve,300));const begun=await call('begin',[r.id,l.lease_id]);await db.exec('commit');assert.equal(begun,null);
 });
 await check('fenced poison custody quarantine releases next job without sending',async()=>{
  await isolate();const i=await invitation(),r=await enqueue(invitationArgs(i)),l=await lease(r.id);
  await service();const failed=(await q('select public.workspace_email_quarantine($1,$2) r',[r.id,l.lease_id])).rows[0].r;assert.equal(failed.status,'failed');
  await admin();assert.equal((await q('select token_ciphertext from workspace_email_outbox where id=$1',[r.id])).rows[0].token_ciphertext,null);
  const j=await invitation(),other=await enqueue(invitationArgs(j));await admin();await db.exec("update workspace_email_rate set next_at=clock_timestamp()-interval '1 second'");await service();const next=await call('claim');assert.equal(next.id,other.id);
 });
 report.passed=report.failures.length===0;
 }catch(e){report.failures.push({name:'setup or harness',message:e.message,stack:e.stack});console.error(e);}
 finally{report.passed=report.failures.length===0;report.passedGroups=report.checks.length;fs.writeFileSync(path.join(out,'db-results.json'),JSON.stringify(report,null,2));if(db)await db.close();console.log((report.passed?'PASS':'FAIL')+' '+report.checks.length+' database groups; '+report.failures.length+' failures; evidence '+path.join(out,'db-results.json'));if(!report.passed)process.exitCode=1;}
})();
