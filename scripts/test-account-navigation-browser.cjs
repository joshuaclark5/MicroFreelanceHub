const fs=require('fs'),assert=require('assert/strict'),{randomUUID}=require('crypto');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/joshu/AppData/Roaming/npm/node_modules/openclaw/node_modules/playwright-core');
const base=process.env.QA_BASE_URL||'http://127.0.0.1:3097',out=process.env.QA_OUT||'C:/Users/joshu/mfh-auth-navigation-evidence';
fs.mkdirSync(out,{recursive:true});let browser;const checks=[];
(async()=>{browser=await chromium.launch({channel:'msedge',headless:true});
for(const width of [320,390,768,1440])for(const signedIn of [false,true]){
 const context=await browser.newContext({viewport:{width,height:950}}),page=await context.newPage();page.setDefaultTimeout(20000);
 const host='rjgttmwrbyjqifodjnqm.supabase.co',user={id:randomUUID(),email:'navigation@example.test',aud:'authenticated',role:'authenticated'};let failLogout=true,logoutCalls=0;
 if(signedIn)await context.addCookies([{name:'sb-'+host.split('.')[0]+'-auth-token',value:encodeURIComponent(JSON.stringify({access_token:'fixture-token',refresh_token:'fixture-refresh',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user})),url:base}]);
 await context.route('**/*',async route=>{const req=route.request(),url=new URL(req.url());
  if(url.hostname===host){if(url.pathname==='/auth/v1/user')return route.fulfill({json:user});if(url.pathname==='/auth/v1/logout'){logoutCalls++;assert.equal(url.searchParams.get('scope'),'local');return route.fulfill(failLogout?{status:400,json:{msg:'Fixture failure'}}:{status:204,body:''});}return route.fulfill({json:[]});}
  if(url.origin!==base)return route.abort();if(url.pathname.startsWith('/api/'))return route.fulfill({status:401,json:{error:'Fixture sign-in required'}});if(!['GET','HEAD'].includes(req.method()))throw Error('Unexpected mutation');return route.continue();
 });
 for(const route of ['/workspace','/guides/client-workflows','/']){
  await page.goto(base+route);const control=signedIn?page.getByRole('button',{name:/^(Log out|Sign out)$/}):page.getByRole('link',{name:/^Log in$/i});await control.first().waitFor({state:'visible'});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow '+route+' '+width);
  if(route!=='/')assert.equal(await page.locator('details[open]').count(),0,'account control must not require opening menu');
  await page.screenshot({path:out+'/'+(route==='/'?'marketing':route==='/workspace'?'workspace':'public')+'-'+width+'-'+(signedIn?'in':'out')+'.png',fullPage:false});
  checks.push({width,signedIn,route,visibleWithoutMenu:true});
 }
 if(signedIn&&width===1440){await page.goto(base+'/workspace');const logout=page.getByRole('button',{name:'Log out',exact:true});await logout.waitFor();page.once('dialog',d=>d.dismiss());await logout.click();assert.equal(logoutCalls,0);
 page.once('dialog',d=>d.accept());await logout.click();await page.getByRole('alert').filter({hasText:'Could not log out'}).waitFor();assert.ok(page.url().endsWith('/workspace'));assert.equal(logoutCalls,1);
 failLogout=false;page.once('dialog',d=>d.accept());await logout.click();await page.waitForURL('**/login?mode=signin&next=/workspace');assert.equal(logoutCalls,2);checks.push({logoutCancel:true,logoutFailureRetainsPage:true,successfulLogoutNavigates:true});}
 await context.close();
}
fs.writeFileSync(out+'/browser-results.json',JSON.stringify({checks,bounds:'Local production build, mocked auth; no real account signed out.'},null,2));console.log('PASS visible signed-in/out navigation: 4 widths x 3 routes; logout cancel/failure/success');
})().catch(e=>{console.error(e);process.exitCode=1;fs.writeFileSync(out+'/browser-results.json',JSON.stringify({checks,error:String(e)},null,2));}).finally(async()=>{if(browser)await browser.close();});
