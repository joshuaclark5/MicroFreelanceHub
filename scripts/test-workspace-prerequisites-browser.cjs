const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
const {chromium}=require('C:/Users/joshu/AppData/Roaming/npm/node_modules/openclaw/node_modules/playwright-core');
const base=process.env.QA_BASE_URL||'http://127.0.0.1:3068',out=process.env.QA_OUT||'../browser';fs.mkdirSync(out,{recursive:true});
const screens=[],checks=[];let browser;
const id=()=>crypto.randomUUID();
(async()=>{browser=await chromium.launch({channel:'msedge',headless:true});
for(const width of (process.env.QA_WIDTHS||'320,390,768,1440').split(',').map(Number)){
 const context=await browser.newContext({viewport:{width,height:950}}),page=await context.newPage();page.setDefaultTimeout(20000);page.setDefaultNavigationTimeout(90000);
 const c=id(),s=id(),p=id(),a=id(),t=id();
 const data={clients:[{id:c,name:'Northstar Studio',email:'studio@example.test',notes:'Fictional fixture only'}],stages:[{id:s,name:'In progress',position:1}],projects:[{id:p,name:'Website refresh',client_id:c,stage_id:s,status:'active',notes:'Two review rounds'}],tasks:[{id:t,title:'Review homepage direction',project_id:p,status:'open',due_date:'2026-11-24'}],agreements:[{id:id(),project_id:p,agreement_id:a}],'available-agreements':[{id:a,title:'Website scope',client_name:'Northstar Studio'}]};
 const originalOwner=id();let account=originalOwner;for(const rows of Object.values(data))for(const r of rows)r.version=1;
 let releaseLoading;let loadingGate=Promise.resolve();
 let mode='normal',failSave=false,uncertainSave=false,expireSave=false;const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{const request=route.request(),url=new URL(request.url());
  if(url.origin!==base)return route.abort();
  if(url.pathname.startsWith('/api/workspace/')){
   const entity=url.pathname.split('/').pop();if(entity==='session'){if(mode==='signedout')return route.fulfill({status:401,json:{error:'Sign in to open your workspace.'}});if(mode==='error')return route.fulfill({status:503,json:{error:'Workspace unavailable. Please retry.'}});if(request.headers()['x-workspace-owner']&&request.headers()['x-workspace-owner']!==account)return route.fulfill({status:409,json:{code:'account_changed',error:'Return to the original account.'}});return route.fulfill({json:{ownerId:account}});}if(!data[entity])return route.fulfill({status:404,json:{error:'Not found'}});
   if(mode==='loading')await loadingGate;
   if(mode==='clipped'&&entity==='clients'&&request.method()==='GET'){const n=Number((url.searchParams.get('after')||'').slice(-12)||0)+1;const record={id:'aaaaaaaa-aaaa-4aaa-8aaa-'+String(n).padStart(12,'0'),version:1,name:'Bounded page '+n,email:'',notes:''};return route.fulfill({json:{ownerId:account,records:[record],hasMore:true,complete:false,truncated:true,nextCursor:record.id}});}
   if(mode==='error')return route.fulfill({status:503,json:{error:'Workspace unavailable. Please retry.'}});
   if(mode==='signedout')return route.fulfill({status:401,json:{error:'Sign in required.'}});
   if(request.headers()['x-workspace-owner']!==account)return route.fulfill({status:409,json:{code:'account_changed',error:'Return to the original account.'}});
   if(request.method()==='GET'){const all=(mode==='empty'?[]:[...data[entity]]).sort((a,b)=>a.id.localeCompare(b.id)).filter(r=>!url.searchParams.get('after')||r.id>url.searchParams.get('after'));const records=all.slice(0,200),hasMore=all.length>records.length;return route.fulfill({json:{ownerId:account,records,hasMore,complete:!hasMore,truncated:hasMore,nextCursor:hasMore?records.at(-1).id:null}});}
   if(expireSave)return route.fulfill({status:401,json:{error:'Sign in required.'}});
   if(failSave)return route.fulfill({status:503,json:{error:'Workspace unavailable. Please retry.'}});
   const input=request.postDataJSON(),target=url.searchParams.get('id');let record;
   if(request.method()!=='POST'&&String(data[entity].find(r=>r.id===target)?.version)!==request.headers()['if-match'])return route.fulfill({status:409,json:{code:'version_conflict',error:'Record changed. Reload and review.'}});
   if(request.method()==='POST'){record={id:id(),version:1,...input};data[entity].unshift(record);}
   if(request.method()==='PATCH'){record=data[entity].find(r=>r.id===target);Object.assign(record,input);record.version++;}
   if(request.method()==='DELETE'){record={id:target};data[entity]=data[entity].filter(r=>r.id!==target);}
   if(uncertainSave&&request.method()==='POST')return route.fulfill({status:200,contentType:'application/json',body:'broken-json'});
   return route.fulfill({status:request.method()==='POST'?201:200,json:{ownerId:account,record}});
  }
  if(!['GET','HEAD','OPTIONS'].includes(request.method()))return route.fulfill({status:400,json:{error:'No external writes'}});
  return route.continue();
 });
 async function snap(name){await page.evaluate(()=>document.fonts.ready);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+' overflow '+width);await page.addScriptTag({path:'C:/Users/joshu/microfreelancehub/node_modules/axe-core/axe.min.js'});const violations=await page.evaluate(async()=>{const r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});return r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}));});screens.push({name,width,violations});await page.screenshot({path:out+'/'+name+'-'+width+'.png',fullPage:true});assert.deepEqual(violations,[],name+' accessibility');}

 for(const section of ['projects','tasks','agreements']) {
  mode='empty';
  await page.goto(base+'/workspace/'+section);
  await page.getByRole('button',{name:section==='agreements'?'Link agreement':'Add '+section.slice(0,-1),exact:true}).click();
  await snap('empty-'+section+'-form');
  checks.push({width,section,saveDisabled:await page.getByRole('button',{name:'Save',exact:true}).isDisabled(),guidance:await page.locator('.suite-form').innerText()});
  assert.equal(await page.getByRole('button',{name:'Save',exact:true}).isDisabled(),true);
  const missing=section==='projects'?['Client','Pipeline stage']:section==='tasks'?['Project']:['Project','Agreement'];
  for(const label of missing)assert.equal(await page.getByLabel(label,{exact:true}).isDisabled(),true);
  const links=await page.locator('.suite-form .suite-confirm a').evaluateAll(es=>es.map(e=>({href:new URL(e.href).pathname,target:e.target,rel:e.rel})));
  assert.equal(links.length,missing.length);
  for(const link of links){assert.equal(link.target,'_blank');assert.ok(link.rel.includes('noopener'));}
  assert.deepEqual(links.map(l=>l.href),section==='projects'?['/workspace/clients','/workspace/stages']:section==='tasks'?['/workspace/projects']:['/workspace/projects','/create']);
  if(section!=='agreements')await page.getByLabel(section==='tasks'?'Task title':'Name',{exact:true}).fill('Retained fictional draft');
  mode='error';
  await page.getByRole('button',{name:'Refresh choices',exact:true}).click();
  await page.getByText('Workspace unavailable. Please retry.',{exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Save',exact:true}).isDisabled(),true);
  if(section!=='agreements')assert.equal(await page.getByLabel(section==='tasks'?'Task title':'Name',{exact:true}).inputValue(),'Retained fictional draft');
  mode='normal';
  await page.getByRole('button',{name:'Refresh choices',exact:true}).click();
  await page.locator('.suite-form .suite-confirm').waitFor({state:'detached'});
  if(section!=='agreements')assert.equal(await page.getByLabel(section==='tasks'?'Task title':'Name',{exact:true}).inputValue(),'Retained fictional draft');
  for(const label of missing)assert.equal(await page.getByLabel(label,{exact:true}).isDisabled(),false);
  assert.equal(await page.getByRole('button',{name:'Save',exact:true}).isDisabled(),false);
  if(section==='projects'){await page.getByLabel('Client',{exact:true}).selectOption(c);await page.getByLabel('Pipeline stage',{exact:true}).selectOption(s);}
  else {await page.getByLabel('Project',{exact:true}).selectOption(p);if(section==='agreements')await page.getByLabel('Agreement',{exact:true}).selectOption(a);}
  await page.getByRole('button',{name:'Save',exact:true}).click();
  await page.getByText('Saved to your workspace.',{exact:true}).waitFor();
  await snap('recovered-'+section);

 }
 await context.close();
}
fs.writeFileSync(out+'/results.json',JSON.stringify({checks,screens},null,2));console.log(JSON.stringify(checks));
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{if(browser)await browser.close()});
