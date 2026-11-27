const fs=require('fs'),assert=require('assert/strict');
const {chromium}=require('C:/Users/joshu/AppData/Roaming/npm/node_modules/openclaw/node_modules/playwright-core');
const base=process.env.QA_BASE_URL;if(!base)throw Error('Explicit verified origin required');
const actor='aaaaaaaa-aaaa-4aaa-8aaa-000000000001',project='aaaaaaaa-aaaa-4aaa-8aaa-000000000002',checks=[];
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});try{
for(const width of [390,1440]){
 const timezoneId=width===390?'America/New_York':'UTC';
 const c=await b.newContext({viewport:{width,height:1000},timezoneId}),p=await c.newPage();
 let writes=0,failCrm=false,failTime=false;const crmRequests=[],errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error'&&/hydration|hydrating|Minified React error/i.test(m.text()))errors.push(m.text());});
 await c.route('**/*',async r=>{const q=r.request(),u=new URL(q.url());
  if(!['GET','HEAD'].includes(q.method())){writes++;return r.abort();}if(u.origin!==base)return r.abort();
  if(u.pathname==='/api/workspace-crm'){crmRequests.push(Object.fromEntries(u.searchParams));if(failCrm)return r.fulfill({status:503,json:{error:'Synthetic load failure'}});return r.fulfill({json:{actorId:actor,records:[],clients:[],next:u.searchParams.has('after')?null:'cursor-page-2',clientsTruncated:false}});}
  if(u.pathname==='/api/workspace-time'){if(failTime)return r.fulfill({status:503,json:{error:'Synthetic time failure'}});return r.fulfill({json:{actorId:actor,records:[],projects:[{id:project,name:'QA project',status:'active'}],running:null,serverNow:new Date().toISOString(),truncated:false,projectsTruncated:false,totals:[]}});}
  if(u.pathname.startsWith('/api/'))return r.fulfill({status:401,json:{error:'Fixture only'}});return r.continue();
 });
 const label=n=>p.getByLabel(n,{exact:true}),button=n=>p.getByRole('button',{name:n,exact:true});
 const settled=()=>p.waitForFunction(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent==='Apply filters');return b&&!b.disabled;});
 const crmState=async()=>({search:await label('Search title').inputValue(),stage:await label('Filter stage').inputValue()});
 await p.goto(base+'/workspace/crm?keep=1');await settled();const initial=crmRequests.length;
 await label('Search title').fill('QA search');await label('Filter stage').selectOption('lead');
 // Observe beyond input events to detect accidental debounced auto-query.
 await p.waitForTimeout(350);assert.equal(crmRequests.length,initial);assert.equal(new URL(p.url()).searchParams.has('q'),false);
 await button('Apply filters').click();await p.waitForURL(u=>u.searchParams.get('q')==='QA search');await settled();
 const firstApply=crmRequests.length;await button('Apply filters').click();await settled();assert.equal(crmRequests.length,firstApply+1);
 await button('Next page').click();await p.waitForURL(u=>u.searchParams.get('after')==='cursor-page-2');await settled();
 await p.goto(base+'/workspace/clients');await p.goBack();await settled();assert.deepEqual(await crmState(),{search:'QA search',stage:'lead'});
 await p.reload();await settled();assert.equal(new URL(p.url()).searchParams.get('after'),'cursor-page-2');assert.deepEqual(await crmState(),{search:'QA search',stage:'lead'});
 failCrm=true;await button('Reload saved opportunities').click();await p.getByRole('alert').filter({hasText:'Synthetic load failure'}).waitFor();assert.equal(new URL(p.url()).searchParams.get('after'),'cursor-page-2');
 failCrm=false;await button('Reload saved opportunities').click();await settled();assert.equal(crmRequests.at(-1).after,'cursor-page-2');
 await button('Apply filters').click();await p.waitForURL(u=>!u.searchParams.has('after'));await settled();await button('Next page').click();await p.waitForURL(u=>u.searchParams.has('after'));await settled();
 assert.equal(new URL(p.url()).searchParams.get('keep'),'1');
 await p.goto(base+'/workspace/time?keep=1');await p.waitForFunction(()=>document.querySelector('input[type=date]')?.value);
 assert.equal(await label('First date (UTC)').inputValue(),new Date().toISOString().slice(0,10));
 await label('First date (UTC)').fill('2026-11-20');await label('View').selectOption('1');await label('Filter project').selectOption(project);await label('Filter billability').selectOption('false');
 await p.waitForURL(u=>u.searchParams.get('billable')==='false');
 const timeState=async()=>({date:await label('First date (UTC)').inputValue(),days:await label('View').inputValue(),project:await label('Filter project').inputValue(),billable:await label('Filter billability').inputValue()});
 const timeReady=()=>p.waitForFunction(id=>[...document.querySelectorAll('select option')].some(o=>o.value===id),project);
 const expected={date:'2026-11-20',days:'1',project,billable:'false'};
 await p.goto(base+'/workspace/clients');await p.goBack();await timeReady();assert.deepEqual(await timeState(),expected);
 await p.reload();await timeReady();assert.deepEqual(await timeState(),expected);
 failTime=true;await button('Reload saved time').click();await p.getByRole('alert').filter({hasText:'Synthetic time failure'}).waitFor();assert.equal(new URL(p.url()).searchParams.get('projectId'),project);
 failTime=false;await button('Reload saved time').click();await timeReady();assert.deepEqual(await timeState(),expected);assert.equal(new URL(p.url()).searchParams.get('keep'),'1');
 assert.equal(writes,0);assert.deepEqual(errors,[]);checks.push({width,timezoneId,crmExplicitApply:true,sameApplyReload:true,paginationBackReloadRetry:true,timeBackReloadRetry:true,dateInitialization:true,noHydrationErrors:true,unrelatedQueryRetained:true,writes});await c.close();
}
}finally{await b.close();fs.writeFileSync(process.env.QA_RECEIPT,JSON.stringify({checks,provider:'mocked',scope:'Actual preview build; navigation only, writes blocked'},null,2));}
console.log(JSON.stringify({checks}));})().catch(e=>{console.error(e.stack);process.exitCode=1;});
