const assert=require('assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/joshu/AppData/Roaming/npm/node_modules/openclaw/node_modules/playwright-core');
const base=process.env.QA_BASE_URL||'http://127.0.0.1:3098';
assert.match(base,/^http:\/\/127\.0\.0\.1:\d+$/);
const uuid=n=>'aaaaaaaa-aaaa-4aaa-8aaa-'+String(n).padStart(12,'0');
const owner=uuid(1),project=uuid(2),task=uuid(3),other=uuid(4),foreign=uuid(99);
const checks=[];let browser;
(async()=>{browser=await chromium.launch({channel:'msedge',headless:true});
for(const width of [360,390,1440]){
 const context=await browser.newContext({viewport:{width,height:900},timezoneId:width===360?'America/Los_Angeles':width===390?'Pacific/Kiritimati':'America/New_York'}),page=await context.newPage();page.setDefaultTimeout(30000);page.setDefaultNavigationTimeout(120000);
 const host='rjgttmwrbyjqifodjnqm.supabase.co',user={id:owner,email:'tasks@example.test',aud:'authenticated',role:'authenticated'};
 await context.addCookies([{name:'sb-'+host.split('.')[0]+'-auth-token',value:encodeURIComponent(JSON.stringify({access_token:'fixture-token',refresh_token:'fixture-refresh',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user})),url:base}]);
 const data={clients:[],stages:[],projects:[{id:project,name:'Synthetic project',status:'active'}],tasks:[{id:task,title:'Exact first task',project_id:project,status:'open',version:1,due_date:'2026-12-01'},{id:other,title:'Exact second task',project_id:project,status:'open',version:1}],agreements:[],'available-agreements':[]};
 let mode='normal',writes=0,release,actor=owner;let gate=Promise.resolve();
 await context.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url());
  if(url.hostname===host)return route.fulfill({status:mode==='signedOut'?401:200,json:mode==='signedOut'?{message:'Signed out'}:url.pathname==='/auth/v1/user'?{...user,id:actor}:[]});
  if(url.origin!==base)return route.abort();
  if(url.pathname.startsWith('/api/workspace/')){
   if(req.method()!=='GET'){writes++;return route.fulfill({status:500,json:{error:'No fixture mutations allowed'}});}
   const entity=url.pathname.split('/').pop();
   if(mode==='loading')await gate;
   if(mode==='expired')return route.fulfill({status:401,json:{error:'Sign in required.'}});
   if(mode==='failure')return route.fulfill({status:503,json:{error:'Synthetic load failure.'}});
   if(entity==='session')return route.fulfill({json:{ownerId:mode==='sessionMismatch'?foreign:actor}});
   if(mode==='denied')return route.fulfill({status:403,json:{error:'Not available.'}});
   if(mode==='ownerMismatch')return route.fulfill({json:{ownerId:foreign,records:[{id:other,title:'Foreign private title'}],complete:true,hasMore:false}});
   if(mode==='clipped'&&entity==='tasks'){const n=Number((url.searchParams.get('after')||'').slice(-12)||100)+1;const record={id:uuid(n),title:'Bounded fixture',project_id:project,status:'open'};return route.fulfill({json:{ownerId:owner,records:[record],complete:false,hasMore:true,nextCursor:record.id}});}
   assert.equal(req.headers()['x-workspace-owner'],actor);
   return route.fulfill({json:{ownerId:actor,records:mode==='empty'?[]:actor!==owner?(entity==='tasks'?[{id:foreign,title:'Other account own task',status:'open'}]:[]):data[entity]||[],complete:true,hasMore:false}});
  }
  if(url.pathname.startsWith('/api/'))return route.fulfill({status:401,json:{error:'Fixture only'}});
  if(!['GET','HEAD'].includes(req.method()))throw Error('Unexpected request');
  return route.continue();
 });
 async function exact(title){await page.getByRole('heading',{name:title,exact:true}).waitFor();assert.equal(await page.locator('.suite-card').count(),1);assert.equal(await page.locator('.suite-card h2').evaluate(el=>el===document.activeElement),true);assert.equal(await page.locator('.suite-form').count(),0);assert.equal(await page.getByRole('button',{name:'Complete',exact:true}).count(),1);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 // Overview metadata is authorized only by the complete, identity-checked snapshot.
 const originalTasks=[...data.tasks],originalProject=data.projects[0].name;
 const longTitle='LongTaskLabel'.repeat(18),longProject='LongProjectLabel'.repeat(18);
 data.projects[0].name=longProject;
 data.tasks.push(
  {id:uuid(5),title:longTitle,project_id:project,status:'open',due_date:'2026-03-08'},
  {id:uuid(6),title:'DST fall date',project_id:project,status:'open',due_date:'2026-11-01'},
  {id:uuid(7),title:'Future task',project_id:project,status:'open',due_date:'2099-01-01'},
  {id:uuid(8),title:'Sixth open task',project_id:project,status:'open'},
  {id:uuid(9),title:'Completed task',project_id:project,status:'done',due_date:'2020-01-01'});
 const rows=page.locator('a.xp-row[href*="/workspace/tasks?task="]');
 async function noOwners(){assert.equal(await rows.count(),0);assert.equal(await page.getByText(/Owner: You/).count(),0);}
 async function overview(){
  await page.goto(base+'/workspace');await rows.first().waitFor();
  assert.deepEqual(await rows.evaluateAll(els=>els.map(e=>e.getAttribute('href'))),[5,6,3,7,4].map(n=>'/workspace/tasks?task='+uuid(n)));
  assert.equal(await page.getByText(/Owner: You/).count(),5);
  assert.deepEqual(await rows.locator('time').evaluateAll(els=>els.map(e=>[e.textContent,e.getAttribute('datetime')])),['2026-03-08','2026-11-01','2026-12-01','2099-01-01'].map(d=>[d,d]));
  assert.match(await rows.last().innerText(),/Owner: You · No due date/);
  assert.equal(await rows.first().locator('small').first().innerText(),longProject);
  assert.equal(await page.getByText('Sixth open task',{exact:true}).count(),0);
  assert.equal(await page.getByText('Completed task',{exact:true}).count(),0);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.ok(await rows.evaluateAll(els=>els.every(e=>[...e.querySelectorAll('strong,small,time')].every(c=>{const r=c.getBoundingClientRect(),p=e.getBoundingClientRect();return r.left>=p.left&&r.right<=p.right+1&&c.scrollWidth<=c.clientWidth+1;}))));
 }
 await overview();
 assert.equal(await page.getByRole('link',{name:'All tasks ↗',exact:true}).getAttribute('href'),'/workspace/tasks');
 for(const state of ['failure','expired','denied','ownerMismatch','sessionMismatch','loading','clipped','empty']){
  mode=state;if(state==='loading')gate=new Promise(r=>release=r);
  await page.getByRole('button',{name:'Refresh workspace',exact:true}).click();
  if(state==='loading'){await page.getByText('Loading your workspace...', {exact:true}).waitFor();await noOwners();mode='normal';release();await rows.first().waitFor();}
  else if(state==='clipped'){await page.getByText(/Large workspace: showing/).waitFor();assert.equal(await rows.count(),5);assert.equal(await page.getByText(/Owner: You/).count(),5);}
  else if(state==='empty'){await page.getByText('A little breathing room.',{exact:true}).waitFor();await noOwners();}
  else {await page.getByRole('alert').waitFor();await noOwners();assert.equal(await page.getByText('Foreign private title',{exact:true}).count(),0);}
  mode='normal';await overview();
 }
 async function authEvent(event,id){await page.evaluate(({event,id,channel})=>{const bus=new BroadcastChannel(channel);bus.postMessage({event,session:id?{user:{id}}:null});bus.close();},{event,id,channel:'sb-'+host.split('.')[0]+'-auth-token'});}
 // Hold the replacement load to observe synchronous clearing of a populated snapshot.
 actor=foreign;mode='loading';gate=new Promise(r=>release=r);await authEvent('SIGNED_IN',actor);
 await page.getByText('Loading your workspace...',{exact:true}).waitFor();await noOwners();mode='normal';release();
 await page.getByText('Other account own task',{exact:true}).waitFor();assert.equal(await rows.count(),1);assert.equal(await page.getByText(/Owner: You/).count(),1);assert.equal(await page.getByText(longTitle,{exact:true}).count(),0);
 mode='signedOut';await context.clearCookies();await authEvent('SIGNED_OUT',null);
 await page.getByText(/Sign in to see your saved|Could not check your account/).waitFor();await noOwners();
 actor=owner;mode='normal';
 await context.addCookies([{name:'sb-'+host.split('.')[0]+'-auth-token',value:encodeURIComponent(JSON.stringify({access_token:'fixture-token',refresh_token:'fixture-refresh',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user})),url:base}]);
 data.tasks=originalTasks;data.projects[0].name=originalProject;
 await page.goto(base+'/workspace');const link=page.locator('a.xp-row').filter({hasText:'Exact second task'});await link.waitFor();assert.equal(await link.getAttribute('href'),'/workspace/tasks?task='+other);await link.focus();await page.keyboard.press('Enter');await exact('Exact second task');await page.reload();await exact('Exact second task');
 await page.goBack();await page.locator('a.xp-row').filter({hasText:'Exact second task'}).waitFor();
 await page.goto(base+'/workspace/tasks?project='+foreign+'&task='+task);await exact('Exact first task');assert.equal(await page.getByRole('link',{name:'Parent project',exact:true}).getAttribute('href'),'/workspace/projects?project='+project);
 await page.getByRole('button',{name:'Edit Exact first task'}).click();await page.getByLabel('Task title',{exact:true}).waitFor();assert.equal(await page.getByLabel('Task title',{exact:true}).inputValue(),'Exact first task');await page.getByRole('button',{name:'Cancel',exact:true}).click();
 await page.getByRole('link',{name:'All tasks',exact:true}).click();await page.locator('.suite-card').nth(1).waitFor();await page.getByRole('searchbox').fill('second');assert.equal(await page.locator('.suite-card').count(),1);
 await page.goto(base+'/workspace/tasks?task='+task.toUpperCase());await exact('Exact first task');
 for(const query of ['task=bad','task=','task='+task+'&task='+other,'task='+foreign]){
  await page.goto(base+'/workspace/tasks?'+query);await page.getByText(query==='task='+foreign?'Task unavailable. It may have been deleted or you may not have access.':'Invalid task link. Choose a task from All tasks.',{exact:true}).waitFor();assert.equal(await page.locator('.suite-card').count(),0);assert.equal(await page.getByText('Exact first task',{exact:true}).count(),0);
 }
 // A formerly valid address no longer resolves after deletion.
 data.tasks=data.tasks.filter(t=>t.id!==task);await page.goto(base+'/workspace/tasks?task='+task);await page.getByText('Task unavailable. It may have been deleted or you may not have access.',{exact:true}).waitFor();
 for(const state of ['failure','expired','denied','ownerMismatch','clipped','loading']){
  mode=state;if(state==='loading')gate=new Promise(r=>release=r);
  await page.goto(base+'/workspace/tasks?task='+other);
  if(state==='loading'){await page.getByText('Loading your saved workspace…',{exact:true}).waitFor();assert.equal(await page.locator('.suite-card').count(),0);release();await exact('Exact second task');}
  else {await page.getByText(state==='clipped'?'This task was not found in the loaded records. The workspace load is incomplete; refresh to try again.':'This task could not be verified. Reconnect or retry loading your workspace.',{exact:true}).waitFor();assert.equal(await page.locator('.suite-card').count(),0);assert.equal(await page.getByText('Foreign private title',{exact:true}).count(),0);}
 }
 assert.equal(writes,0);checks.push({width,result:'pass',cases:['Overview verified owner/date, future/undated, first-five order, completed excluded','long title/project and metadata bounds','DST date-only values across LA/Kiritimati/New York','Overview refresh loading/error/expired/denied/owner and session mismatch/limited/empty','cross-tab identity switch and signout clear populated rows','overview keyboard link','exact second sibling','reload','Back','conflicting filter','parent project','edit cancel','normal list search','uppercase UUID','invalid empty duplicate foreign absent deleted','load failure expired denied mismatched owner partial loading','no horizontal overflow','zero mutations']});await context.close();
}
console.log(JSON.stringify({checks,scope:'Synthetic intercepted local fixtures; no real identities, writes or provider sends'},null,2));
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{if(browser)await browser.close()});
