const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/joshu/AppData/Roaming/npm/node_modules/openclaw/node_modules/playwright-core');
const base=process.env.QA_BASE_URL||'http://127.0.0.1:3099';
const host=process.env.QA_SUPABASE_HOST||'mfh-local-fixture.invalid',actor='00000000-0000-4000-8000-000000000001';
if(new URL(base).hostname!=='127.0.0.1'&&!process.env.QA_SUPABASE_HOST)throw Error('Confirm the preview Supabase host and set QA_SUPABASE_HOST before running hosted fixtures.');
const results=[];
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 for(const width of [390,1440]){
  const ctx=await browser.newContext({viewport:{width,height:1000}}),page=await ctx.newPage();
  let preferences=null,fail=true;const writes=[],errors=[];
  const user={id:actor,aud:'authenticated',role:'authenticated',email:'fixture@example.test',user_metadata:{}};
  page.on('pageerror',e=>errors.push(e.message));
  await ctx.addCookies([{name:'sb-'+host.split('.')[0]+'-auth-token',value:encodeURIComponent(JSON.stringify({access_token:'fixture-token',refresh_token:'fixture-refresh',expires_at:Math.floor(Date.now()/1000)+3600,user,token_type:'bearer'})),url:base}]);
  await ctx.route('**/*',async route=>{
   const request=route.request(),url=new URL(request.url());
   if(url.hostname===host){
    if(url.pathname==='/auth/v1/user')return route.fulfill({json:user});
    if(url.pathname==='/rest/v1/profiles')return route.fulfill({json:{id:actor,full_name:'Test Person',company_name:'Historical company retained',stripe_account_id:null}});
    return route.fulfill({json:[]});
   }
   if(url.origin!==base)return route.abort();
   if(url.pathname==='/api/workspace-preferences'){
    if(request.method()==='POST'){
     const payload=request.postDataJSON();assert.equal(payload.expectedOwner,actor);writes.push(payload);
     if(fail)return route.fulfill({status:503,json:{error:'Synthetic save failure'}});
     preferences=payload.preferences;
    }
    return route.fulfill({json:{ownerId:actor,preferences}});
   }
   if(url.pathname==='/api/stripe/subscription')return route.fulfill({json:{plan:'free',status:'none',canManage:false,canCancel:false}});
   if(!['GET','HEAD'].includes(request.method()))return route.abort();
   return route.continue();
  });
  await page.goto(base+'/workspace/setup?edit=1');
  const field=page.getByLabel('Business or display name');await field.waitFor();
  assert.equal(await field.getAttribute('maxlength'),'120');
  const name='N'.repeat(120);await field.fill(name);
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  await page.getByRole('button',{name:'Save and continue',exact:true}).click();
  await page.getByRole('alert').filter({hasText:'Synthetic save failure'}).waitFor();
  await page.getByRole('button',{name:'Back',exact:true}).click();assert.equal(await field.inputValue(),name);
  fail=false;await page.getByRole('button',{name:'Continue',exact:true}).click();
  await page.getByRole('button',{name:'Save and continue',exact:true}).click();
  await page.getByText('SETUP SAVED',{exact:false}).waitFor();assert.equal(preferences.business,name);
  await page.goto(base+'/workspace/setup?edit=1');await field.waitFor();assert.equal(await field.inputValue(),name);
  await page.goto(base+'/settings');await page.waitForFunction(value=>document.querySelector('#settings-company-name')?.value===value,name);
  await page.reload();await page.waitForFunction(value=>document.querySelector('#settings-company-name')?.value===value,name);
  assert(await page.getByText(/Previous profile company name \(retained\)/).count());
  assert.equal(writes.length,2);assert.deepEqual(errors,[]);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  results.push({width,limit120:true,saveRetry:true,editReload:true,settingsReload:true,legacyRetained:true,mockedProvider:true});
  await ctx.close();
 }
}finally{await browser.close();if(process.env.QA_OUT)fs.writeFileSync(process.env.QA_OUT+'/name-browser.json',JSON.stringify({results,scope:'Intercepted synthetic browser; no hosted writes'},null,2));}
console.log(JSON.stringify(results));})().catch(e=>{console.error(e);process.exitCode=1;});
