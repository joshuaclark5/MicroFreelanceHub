const fs=require('fs'),assert=require('assert/strict');
const {chromium}=require('C:/Users/joshu/AppData/Roaming/npm/node_modules/openclaw/node_modules/playwright-core');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});const results=[];try{for(const width of [390,1440]){const base=process.env.QA_BASE_URL||'http://localhost:3100',host='rjgttmwrbyjqifodjnqm.supabase.co';const user={id:'11111111-1111-4111-8111-111111111111',email:'audit@example.test',aud:'authenticated',role:'authenticated'};const context=await browser.newContext({viewport:{width,height:950}});await context.addCookies([{name:'sb-'+host.split('.')[0]+'-auth-token',value:encodeURIComponent(JSON.stringify({access_token:'fixture-token',refresh_token:'fixture-refresh',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user})),url:base}]);let mutations=0;await context.route('**/*',async r=>{const q=r.request(),u=new URL(q.url());if(!['GET','HEAD'].includes(q.method())){mutations++;return r.abort();}if(u.hostname===host){if(u.pathname==='/auth/v1/user')return r.fulfill({json:user});if(u.pathname==='/rest/v1/profiles')return r.fulfill({json:{full_name:'Fictional Audit',company_name:'Example Studio',stripe_account_id:null}});return r.fulfill({json:[]});}if(u.origin!==base)return r.abort();if(u.pathname==='/api/stripe/subscription')return r.fulfill({json:{plan:'Example paid plan',status:'active',cycle:'1 month',nextDate:'2026-12-24T00:00:00Z',cancelAtPeriodEnd:false,canManage:true,canCancel:true}});if(u.pathname.startsWith('/api/'))return r.fulfill({json:{}});return r.continue();});const page=await context.newPage();await page.goto(base+'/settings');await page.getByRole('button',{name:'Team',exact:true}).filter({visible:true}).click();
const panel=page.getByRole('heading',{name:'Team Management',exact:true});await panel.waitFor();await panel.scrollIntoViewIfNeeded();
if(process.env.QA_BEFORE){
await page.getByRole('button',{name:'Add Team Member',exact:true}).click();
await page.getByLabel('Email Address',{exact:true}).fill('fictional@example.test');
await page.getByRole('button',{name:'Join Agency Waitlist',exact:true}).click();
await page.getByText("You've been added to the Agency waitlist!",{exact:false}).waitFor();
}else{
assert.equal(await page.locator('#team-email').count(),0);
assert.equal(await page.getByRole('button',{name:'Add Team Member',exact:true}).count(),0);
await page.getByText('Waitlist signup is unavailable.',{exact:false}).waitFor();
assert.match(await page.getByRole('link',{name:'Ask about team availability',exact:true}).getAttribute('href'),/^mailto:support@microfreelancehub.com/);
}
await panel.scrollIntoViewIfNeeded();
await panel.locator('..').locator('..').screenshot({path:`artifacts/team-${process.env.QA_BEFORE?'before':'after'}-${width}.png`});
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
results.push({width,base,mutations,before:!!process.env.QA_BEFORE});assert.equal(mutations,0);
await context.close();}}finally{await browser.close();}fs.writeFileSync(`artifacts/team-${process.env.QA_BEFORE?'before':'after'}-browser.json`,JSON.stringify(results,null,2));console.log(JSON.stringify(results.map(({billingText,...r})=>r)));})().catch(e=>{console.error(e);process.exitCode=1});
