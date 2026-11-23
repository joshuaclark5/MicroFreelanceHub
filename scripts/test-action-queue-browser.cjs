const assert = require('node:assert/strict');
const {chromium} = require('C:/Users/joshu/AppData/Roaming/npm/node_modules/openclaw/node_modules/playwright-core');
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:3087';
const host = 'rjgttmwrbyjqifodjnqm.supabase.co';
const user = {id:'00000000-0000-4000-8000-000000000001',email:'fixture@example.test',aud:'authenticated',role:'authenticated'};
const records = [{id:'draft-fixture',user_id:user.id,title:'Example agreement',client_name:'Example client',status:'Draft',price:100,payment_type:'one_time',created_at:'2026-11-22T00:00:00Z'}];
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 for(const width of [320,390,1440]) {
  const context=await browser.newContext({viewport:{width,height:950}});const page=await context.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await context.addCookies([{name:'sb-'+host.split('.')[0]+'-auth-token',value:encodeURIComponent(JSON.stringify({access_token:'fixture-token',refresh_token:'fixture',expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user})),url:base}]);
  await context.route('**/*',route=>{const u=new URL(route.request().url());
   if(u.hostname===host){if(route.request().method()!=='GET')return route.abort();return route.fulfill({json:u.pathname.includes('/auth/v1/user')?user:u.pathname.includes('/profiles')?{id:user.id,is_pro:false,has_completed_onboarding:true}:u.pathname.includes('/sow_documents')?records:[]});}
   if(u.origin!==base)return route.abort();
   if(u.pathname.startsWith('/api/'))return route.fulfill({status:401,json:{error:'Fixture only'}});
   return route.continue();
  });
  await page.goto(base+'/dashboard');
  const queue=page.getByRole('region',{name:'Your next steps'});await queue.waitFor();
  assert.equal(await queue.getByRole('link',{name:'Review draft for Example client'}).getAttribute('href'),'/edit/draft-fixture');
  assert.ok((await queue.innerText()).includes('1 agreements to review'));
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await queue.getByRole('link').focus();assert.equal(await queue.getByRole('link').evaluate(el=>el===document.activeElement),true);
  assert.deepEqual(errors,[]);await context.close();
 }
 console.log('PASS dashboard action queue at 320/390/1440: owner fixture, action URL, keyboard focus, no overflow/runtime errors; no external writes');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
