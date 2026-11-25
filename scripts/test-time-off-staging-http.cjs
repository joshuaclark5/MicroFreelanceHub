const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto'),dotenv=require('dotenv');
const {createClient}=require('@supabase/supabase-js'),{stringifySupabaseSession}=require('@supabase/auth-helpers-shared');
const {chromium}=require('C:/Users/joshu/AppData/Roaming/npm/node_modules/openclaw/node_modules/playwright-core');
const privateRoot='C:/Users/joshu/mfh-private-backups/time-off-staging-1795561114729';
const ref='lfzaivnvoyvdmvvijnoq',origin='http://localhost:3064',out='artifacts/time-off-staging-http';
const env=dotenv.parse(fs.readFileSync(privateRoot+'/http-app.env'));assert.equal(env.NEXT_PUBLIC_SUPABASE_URL,'https://'+ref+'.supabase.co');
for(const field of ['NEXT_PUBLIC_SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY'])assert.equal(JSON.parse(Buffer.from(env[field].split('.')[1],'base64url')).ref,ref);
fs.mkdirSync(out,{recursive:true});
const admin=createClient(env.NEXT_PUBLIC_SUPABASE_URL,env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const owners=[];let browser,cookie,cleanupOwner;
const report={project:ref,checks:[],syntheticOnly:true,productionChanges:false,cleanup:[]};
async function fixture(){
 const email='time-off-stage-'+crypto.randomUUID()+'@example.invalid',password=crypto.randomBytes(32).toString('hex');
 const result=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{qa_fixture:'owner-time-off-http'}});assert.ifError(result.error);
 const id=result.data.user.id;owners.push(id);fs.writeFileSync(privateRoot+'/http-fixtures.json',JSON.stringify({owners,project:ref,at:new Date().toISOString()}));
 const client=createClient(env.NEXT_PUBLIC_SUPABASE_URL,env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
 const login=await client.auth.signInWithPassword({email,password});assert.ifError(login.error);return {id,client,session:login.data.session};
}
async function request(body,auth=true){const r=await fetch(origin+'/api/workspace-time-off',{method:body?'POST':'GET',headers:{...(auth?{Cookie:cookie}:{}),...(body?{'Content-Type':'application/json',Origin:origin}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(25000)});return {status:r.status,body:await r.json(),cache:r.headers.get('cache-control')};}
(async()=>{
 let stageFound=false;for(const file of fs.readdirSync('.next/static/chunks',{recursive:true}).filter(n=>n.endsWith('.js'))){const text=fs.readFileSync(path.join('.next/static/chunks',file),'utf8');assert.ok(!text.includes('rjgttmwrbyjqifodjnqm'));stageFound ||= text.includes(ref);}assert.ok(stageFound);
 assert.equal((await request(null,false)).status,401);
 const denied=await fetch(env.NEXT_PUBLIC_SUPABASE_URL+'/rest/v1/rpc/workspace_time_off_request',{method:'POST',headers:{apikey:env.NEXT_PUBLIC_SUPABASE_ANON_KEY,Authorization:'Bearer '+env.NEXT_PUBLIC_SUPABASE_ANON_KEY,'Content-Type':'application/json','Content-Profile':'public'},body:JSON.stringify({payload:{}}),signal:AbortSignal.timeout(20000)});assert.ok([401,403].includes(denied.status),'anonymous RPC must be denied');
 const owner=await fixture();cleanupOwner=owner;const value=encodeURIComponent(stringifySupabaseSession(owner.session));cookie='sb-'+ref+'-auth-token='+value;
 const boot=await request();assert.equal(boot.status,200);assert.equal(boot.body.actorId,owner.id);assert.match(boot.cache,/no-store/);
 const range={startsOn:'2027-01-11',endsOn:'2027-01-15',timezone:'America/Denver',expectedActorId:owner.id};
 const preview=await request({action:'preview',...range});assert.equal(preview.status,200);assert.equal(preview.body.preview.affectedBookings.length,0);
 const create={action:'create',...range,operationId:crypto.randomUUID(),expectedReviewToken:preview.body.preview.reviewToken};
 assert.equal((await request({...create,operationId:crypto.randomUUID(),expectedReviewToken:'0'.repeat(64)})).status,409);
 const saved=await request(create);assert.equal(saved.status,200);assert.equal(saved.body.record.active,true);assert.equal(saved.body.replayed,false);
 assert.equal(Date.parse(saved.body.record.ends_at)-Date.parse(saved.body.record.starts_at),5*86400000);
 const again=await request(create);assert.equal(again.status,200);assert.equal(again.body.record.id,saved.body.record.id);assert.equal(again.body.replayed,true);
 assert.equal((await request({...create,endsOn:'2027-01-16'})).status,409);
 const list=await request({action:'list',...range});assert.equal(list.status,200);assert.equal(list.body.records.length,1);
 assert.equal((await request({...create,expectedActorId:crypto.randomUUID()})).status,409);
 report.checks.push('Staging-only browser assets; anonymous rejection; authenticated bootstrap; inclusive five-day save/list and same-operation replay; account mismatch');
 browser=await chromium.launch({channel:'msedge',headless:true});
 for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:950},timezoneId:'America/Denver'});await context.addCookies([{name:'sb-'+ref+'-auth-token',value,url:origin}]);
  const page=await context.newPage();page.setDefaultTimeout(25000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/workspace/scheduling/time-off');await page.getByRole('heading',{name:'Take time off across your schedule.'}).waitFor();
  await page.getByLabel('First day',{exact:true}).fill(range.startsOn);await page.getByLabel('Last day (included)',{exact:true}).fill(range.endsOn);
  // UTC view still overlaps the stored Denver range; this also proves list conversion.
  await page.getByRole('button',{name:'Show time off in this range',exact:true}).click();
  await page.getByRole('region',{name:'Saved time off',exact:true}).getByText('2027-01-11 through 2027-01-15',{exact:true}).waitFor();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.deepEqual(errors,[]);
  await page.screenshot({path:out+'/saved-'+width+'.png',fullPage:true});await context.close();
 }
 report.checks.push('Real staging-backed saved time off rendered at 390/1440 with no page errors or horizontal overflow');
 const remove={action:'remove',expectedActorId:owner.id,operationId:crypto.randomUUID(),id:saved.body.record.id,expectedVersion:1};
 const removed=await request(remove);assert.equal(removed.status,200);assert.equal(removed.body.record.active,false);
 assert.equal((await request(remove)).body.replayed,true);assert.equal((await request({action:'list',...range})).body.records.length,0);
 report.checks.push('Authenticated removal and exact retry preserve history and clear active list');
 const quota=await fixture();const payload={action:'list',...range,expectedActorId:quota.id};
 const results=await Promise.all(Array.from({length:31},async(_,i)=>{
  const response=await fetch(env.NEXT_PUBLIC_SUPABASE_URL+'/rest/v1/rpc/workspace_time_off_request',{method:'POST',headers:{apikey:env.NEXT_PUBLIC_SUPABASE_ANON_KEY,Authorization:'Bearer '+quota.session.access_token,'Content-Type':'application/json','Content-Profile':'public','Accept-Profile':'public',...(i%2?{Prefer:'tx=rollback'}:{})},body:JSON.stringify({payload}),signal:AbortSignal.timeout(30000)});
  assert.equal(response.status,200);return response.json();
 }));
 assert.equal(results.filter(r=>r.ok===true).length,30);assert.equal(results.filter(r=>r.code==='rate_limited').length,1);
 report.checks.push('Direct authenticated RPC: 30 admitted / 1 limited across default and requested rollback; quota commits despite ignored tx preference');
})().catch(e=>{report.error=e.message;process.exitCode=1;}).finally(async()=>{
 if(browser)await browser.close();
 if(cleanupOwner){
  try{
   const range={action:'list',expectedActorId:cleanupOwner.id,startsOn:'2027-01-11',endsOn:'2027-01-15',timezone:'America/Denver'};
   const list=await cleanupOwner.client.rpc('workspace_time_off_request',{payload:range});assert.ifError(list.error);assert.equal(list.data.ok,true);
   for(const row of list.data.records){const removed=await cleanupOwner.client.rpc('workspace_time_off_request',{payload:{action:'remove',expectedActorId:cleanupOwner.id,operationId:crypto.randomUUID(),id:row.id,expectedVersion:row.version}});assert.ifError(removed.error);assert.equal(removed.data.ok,true);}
   const check=await cleanupOwner.client.rpc('workspace_time_off_request',{payload:range});assert.ifError(check.error);assert.equal(check.data.ok,true);assert.equal(check.data.records.length,0);report.activeFixtureTimeOff=0;
  }catch(e){report.cleanupError=e.message;process.exitCode=1;}
 }
 for(const id of owners){const result=await admin.auth.admin.updateUserById(id,{ban_duration:'876000h'});report.cleanup.push({owner:id,banned:!result.error});if(result.error)process.exitCode=1;}
 fs.writeFileSync(out+'/result.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
});
