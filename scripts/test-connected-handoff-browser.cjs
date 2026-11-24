const fs=require('fs'),assert=require('assert/strict'),{randomUUID}=require('crypto'),{chromium}=require('C:/Users/joshu/AppData/Roaming/npm/node_modules/openclaw/node_modules/playwright-core');
const base=process.env.QA_BASE_URL||'http://127.0.0.1:3091',out=process.env.QA_OUT||'C:/Users/joshu/mfh-release-evidence-20261123/client-timeline';let browser;const checks=[];fs.mkdirSync(out,{recursive:true});
(async()=>{browser=await chromium.launch({channel:'msedge',headless:true});
for(const width of [390,1440]){
 const context=await browser.newContext({viewport:{width,height:950}}),page=await context.newPage();page.setDefaultTimeout(20000);
 const host='rjgttmwrbyjqifodjnqm.supabase.co',owner=randomUUID(),client=randomUUID(),project=randomUUID(),stage=randomUUID(),user={id:owner,email:'fixture@example.test',aud:'authenticated',role:'authenticated'};
 const data={clients:[{id:client,name:'Fictional Acorn',email:'acorn@example.test',notes:'',version:1}],projects:[{id:project,name:'Fictional website',client_id:client,stage_id:stage,status:'active',notes:'',version:1}],stages:[{id:stage,name:'Active',position:0,version:1}],tasks:[],agreements:[],'available-agreements':[]},inserts=[],errors=[];let revoked=false;
 page.on('pageerror',e=>errors.push(e.message));
 await context.addCookies([{name:'sb-'+host.split('.')[0]+'-auth-token',value:encodeURIComponent(JSON.stringify({access_token:'fixture-token',refresh_token:'fixture-refresh',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user})),url:base}]);
 const fixtureRoute=async route=>{
 const req=route.request(),u=new URL(req.url());
 if(u.hostname===host){
 if(u.pathname==='/auth/v1/user')return route.fulfill({json:user});
 if(u.pathname.includes('/profiles'))return route.fulfill({json:{id:owner,is_pro:false,full_name:'Fictional Owner'}});
 if(u.pathname.includes('/workspace_projects')){assert.equal(u.searchParams.get('owner_id'),'eq.'+owner);return route.fulfill({json:revoked?null:data.projects[0]});}
 if(u.pathname.includes('/workspace_clients')){assert.equal(u.searchParams.get('owner_id'),'eq.'+owner);return route.fulfill({json:data.clients[0]});}
 if(u.pathname.includes('/sow_documents')){
 if(req.method()==='POST'){const row=req.postDataJSON();inserts.push(row);data['available-agreements'].push({id:row.id,title:row.title,client_name:row.client_name});return route.fulfill({status:201,json:row});}
 const found=inserts.find(row=>'eq.'+row.id===u.searchParams.get('id'));
 if(found&&req.method()==='GET')return route.fulfill({json:{...found,created_at:'2026-11-24T12:00:00Z',signed_by:null,provider_sign:null,payment_received_cents:0}});
 return route.fulfill({json:[],headers:{'content-range':'0-0/0'}});
 }
 if(req.method()==='GET')return route.fulfill({json:[]});
 throw Error('Unexpected provider mutation '+u.pathname);
 }
 if(u.origin!==base)return route.abort();
 if(u.pathname.startsWith('/api/workspace/')){
 const entity=u.pathname.split('/').pop();if(entity==='session')return route.fulfill({json:{ownerId:owner}});
 assert.ok(data[entity],entity);
 if(req.method()==='POST'){assert.equal(entity,'agreements');const row={id:randomUUID(),version:1,...req.postDataJSON()};data.agreements.push(row);return route.fulfill({status:201,json:{ownerId:owner,record:row}});}
 return route.fulfill({json:{ownerId:owner,records:data[entity],hasMore:false,complete:true,truncated:false,nextCursor:null}});
 }
 if(u.pathname.startsWith('/api/'))return route.fulfill({status:401,json:{error:'Fixture only'}});
 if(!['GET','HEAD'].includes(req.method()))throw Error('Unexpected local mutation '+u.pathname);
 return route.continue();
 };
 await context.route('**/*',fixtureRoute);
 await page.goto(base+'/workspace/projects');await page.getByRole('link',{name:'Link an agreement',exact:true}).click();await page.getByRole('link',{name:'New agreement for this project'}).click();
 await page.getByLabel('Project name',{exact:true}).waitFor();assert.equal(await page.getByLabel('Project name',{exact:true}).inputValue(),'Fictional website');assert.equal(await page.getByLabel('Client name (optional)',{exact:true}).inputValue(),'Fictional Acorn');assert.equal(await page.getByLabel('Client email (optional)',{exact:true}).inputValue(),'acorn@example.test');
 await page.getByRole('button',{name:'Continue',exact:true}).click();await page.getByLabel('What will you deliver?').fill('A fictional website draft, no customer send.');await page.getByRole('button',{name:'Payment options',exact:true}).click();await page.getByLabel('Project price (USD, optional)').fill('100');await page.getByRole('button',{name:'Review brief',exact:true}).click();await page.getByRole('button',{name:'Review agreement',exact:true}).click();
 await page.screenshot({path:out+'/editor-'+width+'.png',fullPage:true});
 await page.getByRole('button',{name:'Create Client Link',exact:true}).click();await page.waitForURL('**/workspace/agreements?project=*&agreement=*');assert.equal(inserts.length,1);assert.equal(inserts[0].user_id,owner);assert.equal(inserts[0].client_name,'Fictional Acorn');
 await page.getByRole('button',{name:'Link agreement',exact:true}).click();assert.equal(await page.getByLabel('Project',{exact:true}).inputValue(),project);assert.equal(await page.getByLabel('Agreement',{exact:true}).inputValue(),inserts[0].id);await page.getByRole('button',{name:'Save',exact:true}).click();await page.getByRole('link',{name:'Review agreement',exact:true}).waitFor();assert.equal(data.agreements[0].project_id,project);assert.equal(data.agreements[0].agreement_id,inserts[0].id);
 await page.reload();await page.getByRole('link',{name:'Review agreement',exact:true}).waitFor();await page.screenshot({path:out+'/handoff-'+width+'.png',fullPage:true});
 // Separate client context has no owner cookie. The same fictional document must render.
 const customerContext=await browser.newContext({viewport:{width,height:950}});await customerContext.route('**/*',fixtureRoute);
 const customer=await customerContext.newPage();customer.on('pageerror',e=>errors.push(e.message));
 await customer.goto(base+'/sow/'+inserts[0].id);
 const portal=customer.getByTestId('client-portal');await portal.getByRole('heading',{name:'Fictional website',exact:true}).waitFor();
 await customer.getByText('A fictional website draft, no customer send.',{exact:false}).first().waitFor();
 assert.equal(await portal.getByText('Fictional Acorn still needs to sign.',{exact:true}).count(),1);
 assert.equal(await customer.getByRole('button',{name:'Payment Locked (Awaiting Signatures)',exact:true}).isDisabled(),true);
 await customer.getByRole('button',{name:'Agreement actions',exact:true}).click();assert.equal(await customer.getByRole('link',{name:'Edit Contract',exact:true}).count(),0);
 assert.ok(await customer.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await customer.screenshot({path:out+'/customer-preview-'+width+'.png',fullPage:true});await customerContext.close();
 revoked=true;await page.goto(base+'/create?project='+project);await page.getByRole('alert').filter({hasText:'verify this project'}).waitFor();assert.equal(await page.getByRole('button',{name:'Create Client Link',exact:true}).count(),0);assert.equal(inserts.length,1);assert.deepEqual(errors,[]);
 checks.push({width,projectClientPrefilled:true,saveReturnAndExplicitLink:true,linkReadBack:true,anonymousCustomerPreview:true,previewUsesSavedDocument:true,revokedProjectFailsClosed:true});await context.close();
}
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/handoff-browser.json',JSON.stringify({checks,bounds:['Production-rendered UI at '+base+' with fictional Supabase/session and API interception. No real client approvals, signatures, invoices or deployed RLS proof.']},null,2));console.log('PASS project -> agreement draft -> explicit link -> reload -> anonymous preview and revoked-project boundary');
})().catch(e=>{console.error(e);process.exitCode=1;fs.writeFileSync(out+'/handoff-browser.json',JSON.stringify({checks,error:String(e)},null,2));}).finally(async()=>{if(browser)await browser.close();});
