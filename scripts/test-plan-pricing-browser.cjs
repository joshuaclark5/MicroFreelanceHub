// Production-build browser fixtures. All auth/API traffic is intercepted; no Stripe calls.
const fs=require('fs'),assert=require('assert/strict'),{randomUUID}=require('crypto');
const {chromium}=require('C:/Users/joshu/AppData/Roaming/npm/node_modules/openclaw/node_modules/playwright-core');
const base=process.env.QA_BASE_URL||'http://127.0.0.1:3099',out=process.env.QA_OUT||'C:/Users/joshu/pricing-evidence';fs.mkdirSync(out,{recursive:true});let browser;const checks=[];
(async()=>{browser=await chromium.launch({channel:'msedge',headless:true});
for(const width of [320,390,768,1440]){
 const context=await browser.newContext({viewport:{width,height:1000}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));let posts=[],fail=true;
 const user={id:randomUUID(),email:'pricing@example.test',aud:'authenticated',role:'authenticated'},host='rjgttmwrbyjqifodjnqm.supabase.co';
 await context.addCookies([{name:'sb-rjgttmwrbyjqifodjnqm-auth-token',value:encodeURIComponent(JSON.stringify({access_token:'fixture-token',refresh_token:'fixture-refresh',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user})),url:base}]);
 await page.route('**/*',async route=>{const req=route.request(),url=new URL(req.url());if(url.hostname===host)return route.fulfill({json:url.pathname==='/auth/v1/user'?user:[]});if(url.origin!==base)return route.abort();if(url.pathname==='/api/subscription-offer')return route.fulfill({json:{offer:null}});if(url.pathname==='/api/stripe/checkout-plan'){posts.push(req.postDataJSON());return route.fulfill(fail?{status:503,json:{error:'Fixture retry: checkout unavailable'}}:{json:{url:base+'/pricing?fixture=checkout'}});}if(url.pathname.startsWith('/api/'))return route.fulfill({status:401,json:{error:'Fixture'}});return route.continue();});
 await page.goto(base+'/pricing');await page.getByRole('heading',{name:'Agency',exact:true}).waitFor();
 for(const amount of ['$31','$54','$124'])assert.ok((await page.locator('body').innerText()).includes(amount));
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'monthly overflow '+width);
 await page.screenshot({path:out+'/monthly-'+width+'.png',fullPage:true});
 await page.getByLabel('Billing frequency').selectOption('annual');for(const amount of ['$24','$44','$104','$288','$528','$1248'])assert.ok((await page.locator('body').innerText()).includes(amount));
 await page.addScriptTag({path:'C:/Users/joshu/microfreelancehub/node_modules/axe-core/axe.min.js'});const violations=await page.evaluate(async()=> (await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>v.id));assert.deepEqual(violations,[]);
 await page.screenshot({path:out+'/annual-'+width+'.png',fullPage:true});
 await page.getByRole('button',{name:'Start Starter',exact:true}).click();await page.getByRole('heading',{name:'Review your subscription'}).waitFor();assert.ok(page.url().includes('billing=annual'));assert.equal(posts.length,0);await page.getByText('$288',{exact:false}).first().waitFor();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'review overflow '+width);
 await page.screenshot({path:out+'/review-'+width+'.png',fullPage:true});
 await page.getByRole('button',{name:'Continue to secure checkout'}).click();await page.getByRole('alert').filter({hasText:'Fixture retry: checkout unavailable'}).waitFor();assert.equal(posts[0].billingCycle,'annual');assert.equal(posts[0].plan,'starter');assert.equal(posts[0].pricingVersion,'2026-11-23-hb-minus-five');
 fail=false;await page.getByRole('button',{name:'Continue to secure checkout'}).click();await page.waitForURL('**/pricing?fixture=checkout');assert.equal(posts.length,2);
 for(const [plan,cycle,amount]of [['starter','monthly',31],['pro','monthly',54],['agency','monthly',124],['pro','annual',528],['agency','annual',1248]]){await page.goto(base+'/checkout-plan?plan='+plan+'&billing='+cycle);await page.getByRole('heading',{name:'Review your subscription'}).waitFor();assert.ok((await page.locator('body').innerText()).includes('$'+amount));}assert.equal(posts.length,2,'review never starts checkout automatically');
 await context.clearCookies();await page.goto(base+'/checkout-plan?plan=agency&billing=annual');await page.getByRole('button',{name:'Continue to secure checkout'}).click();await page.waitForURL('**/login?**');assert.equal(new URL(page.url()).searchParams.get('billing'),'annual');assert.equal(new URL(page.url()).searchParams.get('plan'),'agency');
 assert.deepEqual(errors,[]);checks.push({width,monthlyAnnual:true,reviewBeforeSend:true,failedRetry:true,signedOutAnnualPreserved:true,violations});await context.close();
}console.log('PASS pricing: four widths, all six quotes, annual selection, explicit review, failed retry, signed-out handoff, accessibility.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{fs.writeFileSync(out+'/checks.json',JSON.stringify({checks,boundary:'Mocked auth and checkout; no live billing or payment'},null,2));await browser?.close();});
