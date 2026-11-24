const fs = require('node:fs'), assert = require('node:assert/strict'), {randomUUID:id} = require('node:crypto');
const {chromium} = require('C:/Users/joshu/AppData/Roaming/npm/node_modules/openclaw/node_modules/playwright-core');
const base = process.env.QA_BASE_URL || 'https://www.microfreelancehub.com';
const out = process.env.QA_OUT || 'artifacts/customer-journey';
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true}); const report={base,at:new Date().toISOString(),fixtures:true,previewBoundary:'Link target only; document editor, invoice, signatures and customer preview not exercised',checks:[]};
 try {
 for(const width of [390,1440]) {
  const context=await browser.newContext({viewport:{width,height:1000}}),page=await context.newPage();
  page.setDefaultTimeout(20000); const owner=id(),stage=id(),otherClient=id(),otherProject=id(),agreement=id(),decoyAgreement=id();
  const data={clients:[{id:otherClient,name:'Other fictional client',version:1}],stages:[{id:stage,name:'In progress',position:1,version:1}],projects:[{id:otherProject,name:'Other fictional project',client_id:otherClient,stage_id:stage,status:'active',version:1}],tasks:[],agreements:[],'available-agreements':[{id:agreement,title:'Fictional project scope',client_name:'Journey Studio'},{id:decoyAgreement,title:'Fictional project scope',client_name:'Other fictional client'}]};
  const writes=[],errors=[],blocked=[];let failTask=true;
  page.on('pageerror',e=>errors.push(e.message));
  await context.route('**/*',async route=>{
   const req=route.request(),url=new URL(req.url());
   if(url.origin!==new URL(base).origin)return route.abort();
   if(url.pathname==='/api/workspace/session')return route.fulfill({json:{ownerId:owner}});
   if(url.pathname==='/api/workspace-client-timeline')return route.fulfill({json:{actorId:owner,records:[],truncated:false}});
   if(url.pathname.startsWith('/api/workspace/')){
    const entity=url.pathname.split('/').pop();
    if(!data[entity])return route.fulfill({status:404,json:{error:'Unknown fixture endpoint'}});
    assert.equal(req.headers()['x-workspace-owner'],owner);
    if(req.method()==='GET')return route.fulfill({json:{ownerId:owner,records:[...data[entity]].sort((a,b)=>a.id.localeCompare(b.id)),hasMore:false,complete:true,truncated:false,nextCursor:null}});
    writes.push({entity,method:req.method()});
    assert.equal(req.method(),'POST');
    if(entity==='tasks'&&failTask){failTask=false;return route.fulfill({status:503,json:{error:'Fictional service interruption'}});}
    const record={...req.postDataJSON(),id:id(),version:1};data[entity].push(record);
    return route.fulfill({status:201,json:{ownerId:owner,record}});
   }
   if(url.pathname.startsWith('/api/')||!['GET','HEAD'].includes(req.method())){blocked.push(url.pathname);return route.fulfill({status:401,json:{error:'Fixture boundary: blocked'}});}
   return route.continue();
  });
  async function snap(name){await page.evaluate(()=>document.fonts.ready);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+' overflow');await page.screenshot({path:`${out}/${name}-${width}.png`,fullPage:true});}
  await page.goto(base+'/workspace/clients');
  await page.getByRole('button',{name:'Add client',exact:true}).click();
  await page.getByLabel('Name',{exact:true}).fill('Journey Studio');await page.getByLabel('Email (optional)').fill('journey@example.invalid');
  await page.getByRole('button',{name:'Save',exact:true}).click();await page.getByText('Saved to your workspace.',{exact:true}).waitFor();
  const client=data.clients.find(x=>x.name==='Journey Studio');assert.ok(client);
  const clientCard=page.locator('.suite-card').filter({has:page.getByRole('heading',{name:'Journey Studio',exact:true})});
  await clientCard.getByRole('link',{name:'Projects for this customer',exact:true}).click();
  await page.getByRole('button',{name:'Add project',exact:true}).click();assert.equal(await page.getByLabel('Client',{exact:true}).inputValue(),client.id);
  await page.getByLabel('Name',{exact:true}).fill('Journey website');await page.getByLabel('Pipeline stage',{exact:true}).selectOption(stage);
  await page.getByRole('button',{name:'Save',exact:true}).click();await page.getByRole('heading',{name:'Journey website',exact:true}).waitFor();
  const project=data.projects.find(x=>x.name==='Journey website');assert.equal(project.client_id,client.id);
  assert.equal(await page.getByRole('heading',{name:'Other fictional project',exact:true}).count(),0);await snap('client-project-context');
  await page.getByRole('link',{name:'Manage tasks',exact:true}).click();await page.getByRole('button',{name:'Add task',exact:true}).click();
  assert.equal(await page.getByLabel('Project',{exact:true}).inputValue(),project.id);
  await page.getByLabel('Task title',{exact:true}).fill('Approve fictional direction');await page.getByRole('button',{name:'Save',exact:true}).click();
  await page.locator('.suite-error').filter({hasText:'Fictional service interruption'}).waitFor();assert.equal(await page.getByLabel('Task title',{exact:true}).inputValue(),'Approve fictional direction');assert.equal(data.tasks.length,0);
  await page.getByRole('button',{name:'Reload saved records',exact:true}).click();await page.getByRole('button',{name:'I checked the saved records; allow retry',exact:true}).click();await page.getByRole('button',{name:'Save',exact:true}).click();
  await page.getByRole('heading',{name:'Approve fictional direction',exact:true}).waitFor();await page.reload();await page.getByRole('heading',{name:'Approve fictional direction',exact:true}).waitFor();assert.equal(data.tasks.length,1);assert.equal(data.tasks[0].project_id,project.id);await snap('task-saved-reloaded');
  await page.getByRole('link',{name:'Projects',exact:true}).click();
  const projectCard=page.locator('.suite-card').filter({has:page.getByRole('heading',{name:'Journey website',exact:true})});
  await projectCard.getByText('Next: Approve fictional direction',{exact:true}).waitFor();await projectCard.getByRole('link',{name:'Link an agreement',exact:true}).click();
  await page.getByRole('button',{name:'Link agreement',exact:true}).click();assert.equal(await page.getByLabel('Project',{exact:true}).inputValue(),project.id);
  await page.getByLabel('Agreement',{exact:true}).selectOption(agreement);await page.getByRole('button',{name:'Save',exact:true}).click();await page.getByText('Saved to your workspace.',{exact:true}).waitFor();
  assert.equal(data.agreements.length,1);assert.equal(data.agreements[0].project_id,project.id);assert.equal(data.agreements[0].agreement_id,agreement);
  assert.equal(await page.getByRole('link',{name:'Review agreement',exact:true}).getAttribute('href'),'/sow/'+agreement);await snap('agreement-link-review-boundary');
  assert.equal(writes.length,5);assert.deepEqual(errors,[]);
  report.checks.push({width,passed:true,mockedWriteAttempts:writes.length,recordsCreated:4,failedTaskRetained:true,relationIdsVerified:true,documentNavigation:'Not followed',blockedOtherAPIs:[...new Set(blocked)]});await context.close();
 }
 }finally{fs.writeFileSync(out+'/results.json',JSON.stringify(report,null,2));await browser.close();}
 console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exitCode=1});
