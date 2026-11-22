const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict'),ts=require('typescript');
const root=path.resolve(__dirname,'..');
const env={CRON_SECRET:'fictional-secret-'.repeat(3),EMAIL_OUTBOX_WORKER_ENABLED:'true',EMAIL_OUTBOX_SEND_ENABLED:'true',NEXT_PUBLIC_SUPABASE_URL:'https://fixture.invalid',SUPABASE_SERVICE_ROLE_KEY:'fictional',RESEND_API_KEY:'fictional',EMAIL_OUTBOX_FROM:'sender@fixture.invalid',EMAIL_OUTBOX_SITE_ORIGIN:'https://fixture.invalid',EMAIL_OUTBOX_ACTIVE_KEY_ID:'k1',EMAIL_OUTBOX_KEYS_JSON:JSON.stringify({k1:Buffer.alloc(32,7).toString('base64')})};
function harness(environment=env,options={}){
 const calls=[],network=[],rows=options.rows||[],row={id:crypto.randomUUID(),lease_id:crypto.randomUUID(),template:'booking-reminder.v1',recipient:'recipient@fixture.invalid',starts_at:'2030-01-01T12:00:00Z',timezone:'UTC'};
 const db={
  rpc:async(name,args)=>{calls.push({name,args});if(options.rpcError===name)return {error:{message:'PRIVATE SECRET'}};return {data:name==='workspace_email_evidence_next'?(rows[0]||null):name==='workspace_email_claim'?(options.idle?null:row):name==='workspace_email_begin'?(options.canceled?null:row):name==='workspace_email_finish'?{status:'accepted'}:name==='workspace_email_reconcile'?{status:args.provider_event}:null};},
  from:table=>{
   const q={table,filters:[]};calls.push(q);
   const builder={select:s=>{q.select=s;return builder;},in:(k,v)=>{q.filters.push([k,v]);return builder;},not:(...v)=>{q.filters.push(v);return builder;},order:(...v)=>{(q.order||=[]).push(v);return builder;},limit:n=>{q.limit=n;return builder;},update:v=>{q.update=v;return builder;},eq:(...v)=>{q.filters.push(v);return builder;},then:(resolve,reject)=>Promise.resolve({data:q.update?null:rows.slice(0,q.limit),error:options.queryError?{message:'PRIVATE SECRET'}:null}).then(resolve,reject)};
   return builder;
  }
 };
 const fetcher=async(url,init)=>{network.push({url,init});if(options.fetchError)throw Error('PRIVATE SECRET');return {ok:true,status:200,headers:new Headers(),json:async()=>init.method==='POST'?{id:'p1'}:options.evidence||{id:'p0',to:['recipient@fixture.invalid'],from:env.EMAIL_OUTBOX_FROM,last_event:'delivered'}};};
 const cache={};
 function load(file){
  file=path.resolve(root,file);if(cache[file])return cache[file];if(file.endsWith('.json'))return JSON.parse(fs.readFileSync(file));
  const module={exports:{}};cache[file]=module.exports;
  const req=n=>n==='node:crypto'?crypto:n==='next/server'?{NextResponse:{json:(body,opts)=>({body,...opts})}}:n==='@supabase/supabase-js'?{createClient:()=>{calls.push({client:true});return db;}}:n.startsWith('.')?load(path.resolve(path.dirname(file),n)+(path.extname(n)?'':'.ts')):(()=>{throw Error('Unexpected import '+n);})();
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,{module,exports:module.exports,require:req,process:{env:environment},Buffer,URL,Date,AbortSignal,fetch:fetcher});
  return module.exports;
 }
 const config=load('app/lib/server/emailWorkerConfig.ts'),route=load('app/api/internal/email-worker/route.ts'),batch=load('app/lib/server/emailWorkerBatch.ts');
 return {calls,network,config,run:(method='GET',authorization='Bearer '+environment.CRON_SECRET,query='')=>route[method](new Request('https://fixture.invalid/api/internal/email-worker'+query,{method,headers:authorization?{authorization}:{}})),batch:()=>batch.runEmailWorkerBatch(db,environment,fetcher)};
}
(async()=>{
 let count=0;async function test(name,fn){await fn();count++;console.log('PASS '+name);}
 await test('GET and POST require exact bearer and fail closed before DB/provider',async()=>{
  for(const method of ['GET','POST'])for(const auth of [null,'','Bearer wrong','bearer '+env.CRON_SECRET,'Bearer '+env.CRON_SECRET+'x']){
   const h=harness();assert.equal((await h.run(method,auth)).status,401);assert.equal(h.calls.length,0);assert.equal(h.network.length,0);
  }
  for(const secret of [undefined,'short',' '.repeat(40),'x'.repeat(257)]){
   const h=harness({...env,CRON_SECRET:secret});assert.equal((await h.run()).status,401);assert.equal(h.calls.length,0);
  }
 });
 await test('all worker/send/keyring/database gates block work and preview is not scheduled',async()=>{
  for(const key of ['EMAIL_OUTBOX_WORKER_ENABLED','EMAIL_OUTBOX_SEND_ENABLED','NEXT_PUBLIC_SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','RESEND_API_KEY','EMAIL_OUTBOX_KEYS_JSON','EMAIL_OUTBOX_FROM','EMAIL_OUTBOX_SITE_ORIGIN']){
   const h=harness({...env,[key]:undefined});assert.equal((await h.run()).status,503,key);assert.equal(h.calls.length,0,key);await assert.rejects(h.batch);
  }
  assert.equal(harness().config.emailWorkerScheduled(),false);
  assert.equal(harness({...env,VERCEL_ENV:'preview'}).config.emailWorkerScheduled(),false);
  assert.equal(harness({...env,VERCEL_ENV:'production'}).config.emailWorkerScheduled(),true);
  assert.equal(harness({...env,VERCEL_ENV:'production',EMAIL_OUTBOX_WORKER_ENABLED:'false'}).config.emailWorkerScheduled(),false);
 });
 await test('bounded real worker dispatch and exact provider delivery reconciliation; safe HTTP response',async()=>{
  const h=harness(env,{rows:[{id:'r0',provider_id:'p0',recipient:'recipient@fixture.invalid'},{id:'r2',provider_id:'p2',recipient:'other@fixture.invalid'}]});
  const result=await h.run('POST');assert.equal(result.status,200);assert.equal(result.body.dispatchStatus,'accepted');assert.equal(result.body.reconciled,1);
  assert.equal(h.network.length,2);assert.equal(h.network.filter(c=>c.init.method==='POST').length,1);
  assert.deepEqual(h.calls.filter(c=>c.name).map(c=>c.name),['workspace_email_evidence_next','workspace_email_reconcile','workspace_email_claim','workspace_email_begin','workspace_email_finish']);
  assert.equal(h.calls.filter(c=>c.name==='workspace_email_evidence_next').length,1);assert.equal(result.headers['Cache-Control'],'private, no-store');
  for(const secret of [env.CRON_SECRET,env.RESEND_API_KEY,'recipient@fixture.invalid','p0','r0'])assert.ok(!JSON.stringify(result).includes(secret));
 });
 await test('unconfirmed evidence rotates metadata without inventing delivery or resend',async()=>{
  const h=harness(env,{idle:true,rows:[{id:'r0',provider_id:'p0',recipient:'recipient@fixture.invalid'}],evidence:{id:'wrong'}});
  const result=await h.run();assert.equal(result.body.unconfirmed,1);assert.equal(result.body.reconciled,0);assert.equal(h.network.length,1);
  assert.ok(!h.calls.some(c=>c.name==='workspace_email_reconcile'));
  assert.ok(!h.calls.some(c=>c.table)); // No direct table grants or client evidence input.
 });
 await test('finish failure does not retry, redacts errors; current authorization cancels send',async()=>{
  const h=harness(env,{rpcError:'workspace_email_finish'});const result=await h.run();assert.equal(result.status,503);assert.equal(h.network.length,1);assert.ok(!JSON.stringify(result).includes('PRIVATE SECRET'));
  const canceled=harness(env,{canceled:true});assert.equal((await canceled.run()).body.dispatchStatus,'canceled');assert.equal(canceled.network.length,0);
  const query=harness();assert.equal((await query.run('GET','Bearer '+env.CRON_SECRET,'?id=foo')).status,400);assert.equal(query.calls.length,0);
 });
 await test('missing worker SQL prerequisite fails before dispatch or provider',async()=>{const h=harness(env,{rpcError:'workspace_email_evidence_next'});assert.equal((await h.run()).status,503);assert.equal(h.network.length,0);assert.ok(!h.calls.some(c=>c.name==='workspace_email_claim'));});
 console.log('PASS '+count+' worker groups; real implementation with fictional DB/provider transport only; no live sends.');
})().catch(e=>{console.error(e);process.exitCode=1;});
