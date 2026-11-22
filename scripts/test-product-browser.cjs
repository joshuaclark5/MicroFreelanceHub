const assert=require('assert/strict'),fs=require('fs');
const {chromium}=require('C:/Users/joshu/AppData/Roaming/npm/node_modules/openclaw/node_modules/playwright-core');
const base=process.env.QA_BASE_URL||'http://127.0.0.1:3079',out=process.env.QA_OUT;
if(!out)throw Error('Private QA_OUT required');fs.mkdirSync(out,{recursive:true});
const host='rjgttmwrbyjqifodjnqm.supabase.co',user={id:'00000000-0000-4000-8000-000000000001',email:'fixture@example.test',aud:'authenticated',role:'authenticated'};
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});const checks=[];try{
 for(const width of [320,390,1440]){
  const context=await browser.newContext({viewport:{width,height:950}}),page=await context.newPage(),errors=[],updates=[];let failSave=true;
  page.on('pageerror',e=>errors.push(e.message));
  await context.addCookies([{name:'sb-'+host.split('.')[0]+'-auth-token',value:encodeURIComponent(JSON.stringify({access_token:'fixture-token',refresh_token:'fixture-refresh',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user})),url:base}]);
  await context.route('**/*',async route=>{
   const request=route.request(),u=new URL(request.url());
   if(u.hostname===host){
    if(u.pathname==='/auth/v1/user')return route.fulfill({json:user});
    if(u.pathname.includes('/profiles')){
     if(request.method()==='PATCH'){updates.push(request.postDataJSON());return route.fulfill({status:failSave?503:200,json:failSave?{message:'Synthetic unavailable'}:{id:user.id}});}
     return route.fulfill({json:{id:user.id,is_pro:false,has_completed_onboarding:false,stripe_account_id:null,full_name:'Existing name',business_name:'Existing studio'}});
    }
    if(request.method()==='GET')return route.fulfill({json:[]});
    throw Error('Unexpected external mutation '+u.pathname);
   }
   if(u.origin!==base)return route.abort();
   if(u.pathname.startsWith('/api/'))return route.fulfill({status:401,json:{error:'Fixture sign-in gate'}});
   return route.continue();
  });
  await page.goto(base+'/dashboard');
  const dialog=page.getByRole('dialog');await dialog.waitFor();
  await page.waitForFunction(()=>document.querySelector('#welcome-name')?.value==='Existing name');
  assert.equal(await page.getByLabel('Business name (optional)',{exact:false}).inputValue(),'Existing studio');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.getByLabel('Your name',{exact:true}).fill('Updated name');
  await page.getByLabel('Business name (optional)',{exact:false}).fill('');
  await page.getByRole('button',{name:'Save and continue'}).click();await page.getByRole('alert').filter({hasText:'could not be saved'}).waitFor();
  assert.equal(await page.getByLabel('Your name',{exact:true}).inputValue(),'Updated name');
  await page.screenshot({path:out+'/onboarding-'+width+'.png',fullPage:true});
  failSave=false;await page.getByRole('button',{name:'Save and continue'}).click();await page.waitForURL(base+'/create');
  assert.equal(updates.length,2);assert.deepEqual(updates[1],{full_name:'Updated name',business_name:'',has_completed_onboarding:true});
  assert.deepEqual(errors,[]);checks.push('Onboarding prefill, optional field, retry preserves input, success at '+width+'px');
  await context.close();
 }
 const context=await browser.newContext(),page=await context.newPage();
 await context.route(/googletagmanager|google-analytics/,route=>route.abort());
 await page.goto(base+'/?secret=do-not-track-this');
 await page.waitForFunction(()=>window.dataLayer?.length>0);
 const events=await page.evaluate(()=>window.dataLayer.map(x=>Array.from(x)));
 assert.ok(!JSON.stringify(events).includes('do-not-track-this'));
 const pageViews=events.filter(x=>x[0]==='event'&&x[1]==='page_view');assert.equal(pageViews.length,1);
 assert.equal(pageViews[0][2].page_location,'https://www.microfreelancehub.com/');
 await page.goto(base+'/login?mode=signin&token=secret');assert.equal(await page.locator('script[src*="googletagmanager"]').count(),0);
 await page.goto(base+'/articles/weekly-freelance-project-review-checklist');
 await page.getByRole('heading',{level:1,name:'A Weekly Freelance Project Review: What to Check Before Monday'}).waitFor();
 assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'),'https://www.microfreelancehub.com/articles/weekly-freelance-project-review-checklist');
 checks.push('GA public location sanitized, one page view, auth page excluded; original article renders with canonical');
 await context.close();
 fs.writeFileSync(out+'/browser.json',JSON.stringify({at:new Date().toISOString(),base,checks,allAuthAndWritesMocked:true},null,2));console.log(JSON.stringify({checks}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
