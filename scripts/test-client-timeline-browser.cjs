const fs=require('fs'),assert=require('assert/strict'),{randomUUID}=require('crypto'),{chromium}=require('C:/Users/joshu/AppData/Roaming/npm/node_modules/openclaw/node_modules/playwright-core');
const base=process.env.QA_BASE_URL||'http://127.0.0.1:3091',out=process.env.QA_OUT||'C:/Users/joshu/mfh-release-evidence-20261123/client-timeline';fs.mkdirSync(out,{recursive:true});let browser;const checks=[];
(async()=>{browser=await chromium.launch({channel:'msedge',headless:true});
for(const width of [320,390,768,1440]){
 const context=await browser.newContext({viewport:{width,height:950}}),page=await context.newPage();page.setDefaultTimeout(20000);
 const owner=randomUUID(),other=randomUUID(),client=randomUUID(),opportunity=randomUUID();let account=owner,uncertain=false,clipped=false;const writes=[],saved=new Map(),entries=[{id:randomUUID(),source:'opportunity',kind:'note',body:'Preserved opportunity conversation',created_at:'2026-11-22T14:00:00Z',author_id:owner,author_name:'Original Author',opportunity_id:opportunity,title:'Fictional opportunity'},{id:randomUUID(),source:'opportunity',kind:'create',body:'',created_at:'2026-11-21T14:00:00Z',author_id:owner,author_name:null,opportunity_id:opportunity,title:'Fictional opportunity'}],errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await context.route('**/*',async route=>{
 const req=route.request(),u=new URL(req.url());if(u.origin!==base)return route.abort();
 if(u.pathname==='/api/workspace-client-timeline'){
 if(req.headers()['x-workspace-owner']!==account)return route.fulfill({status:409,json:{error:'Account changed. Return to the original account.'}});
 if(req.method()==='GET')return route.fulfill({json:{actorId:account,records:entries,truncated:clipped}});
 const p=req.postDataJSON();writes.push(p);let row=saved.get(p.operationId);
 if(!row){row={id:randomUUID(),source:'client_note',kind:'note',body:p.body,created_at:new Date().toISOString(),author_id:owner,author_name:'Current Author',opportunity_id:null,title:null};saved.set(p.operationId,row);entries.unshift(row);}
 if(uncertain){uncertain=false;return route.fulfill({status:503,json:{error:'Save outcome is unconfirmed. Retry the same note.'}});}
 return route.fulfill({json:{actorId:account,record:row}});
 }
 if(u.pathname.startsWith('/api/workspace/')){
 const entity=u.pathname.split('/').pop();
 if(entity==='session')return route.fulfill({json:{ownerId:owner}});
 const records=entity==='clients'?[{id:client,version:1,name:'Fictional Acorn',email:'acorn@example.test',notes:'Existing editable summary'}]:[];
 return route.fulfill({json:{ownerId:owner,records,hasMore:false,complete:true,truncated:false,nextCursor:null}});
 }
 if(u.pathname.startsWith('/api/'))return route.fulfill({status:401,json:{error:'Fixture only'}});
 if(!['GET','HEAD'].includes(req.method()))throw Error('Unexpected mutation '+u.pathname);
 return route.continue();
 });
 await page.goto(base+'/workspace/clients');await page.getByRole('button',{name:'Open client timeline',exact:true}).click();
 await page.getByText('Preserved opportunity conversation',{exact:true}).waitFor();await page.getByText('Historical account owner (name was not recorded)',{exact:false}).waitFor();
 for(const body of ['First independent note','Second independent note','Third independent note']){
 await page.getByLabel('New note for Fictional Acorn').fill(body);await page.getByRole('button',{name:'Add note',exact:true}).click();await page.getByText(body,{exact:true}).waitFor();
 }
 assert.equal(saved.size,3);assert.equal(await page.locator('.client-timeline time').count(),5);assert.equal(await page.getByText('Existing editable summary',{exact:true}).count(),1);
 await page.reload();await page.getByRole('button',{name:'Open client timeline',exact:true}).click();await page.getByText('Third independent note',{exact:true}).waitFor();
 uncertain=true;await page.getByLabel('New note for Fictional Acorn').fill('Uncertain fourth note');await page.getByRole('button',{name:'Add note',exact:true}).click();await page.getByRole('alert').filter({hasText:'unconfirmed'}).waitFor();assert.equal(saved.size,4);
 await page.getByRole('button',{name:'Refresh timeline and check account'}).click();await page.getByRole('button',{name:'Retry same note',exact:true}).click();await page.getByRole('button',{name:'Add note',exact:true}).waitFor();assert.equal(saved.size,4);assert.deepEqual(writes.at(-1),writes.at(-2));
 await page.getByLabel('New note for Fictional Acorn').fill('Original account draft');account=other;
 await page.getByRole('button',{name:'Add note',exact:true}).click();await page.getByRole('alert').filter({hasText:'Account changed'}).waitFor();assert.equal(await page.getByText('Third independent note',{exact:true}).count(),0);assert.equal(await page.getByLabel('New note for Fictional Acorn').count(),0);assert.equal(saved.size,4);
 account=owner;await page.getByRole('button',{name:'Refresh timeline and check account'}).click();await page.getByRole('button',{name:'Retry same note',exact:true}).waitFor();assert.equal(await page.getByLabel('New note for Fictional Acorn').inputValue(),'Original account draft');await page.getByRole('button',{name:'Retry same note',exact:true}).click();await page.getByRole('button',{name:'Add note',exact:true}).waitFor();assert.equal(saved.size,5);
 clipped=true;await page.getByRole('button',{name:'Refresh timeline and check account'}).click();await page.getByText('Showing the latest 200 entries only.',{exact:false}).waitFor();
 await page.addScriptTag({path:'C:/Users/joshu/microfreelancehub/node_modules/axe-core/axe.min.js'});const violations=await page.evaluate(async()=>{const r=await axe.run(document.querySelector('.client-timeline'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});return r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}));});assert.deepEqual(violations,[]);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow at '+width);
 await page.screenshot({path:out+'/timeline-'+width+'.png',fullPage:true});assert.deepEqual(errors,[]);checks.push({width,notes:5,uncertainRetryDeduplicated:true,accountMismatchHidesHistoryAndDraft:true,axeViolations:violations});await context.close();
}
fs.writeFileSync(out+'/browser-results.json',JSON.stringify({checks,bounds:['Production build in local browser; all APIs intercepted with fictional records. No live Supabase/customer/session proof.']},null,2));console.log('PASS client timeline 4 widths, separate notes, replay, reload, account mismatch, bounded history and axe');
})().catch(e=>{console.error(e);process.exitCode=1;fs.writeFileSync(out+'/browser-results.json',JSON.stringify({checks,error:String(e)},null,2));}).finally(async()=>{if(browser)await browser.close();});
