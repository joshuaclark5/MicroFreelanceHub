const assert=require('assert/strict'),fs=require('fs');
const {chromium}=require('C:/Users/joshu/AppData/Roaming/npm/node_modules/openclaw/node_modules/playwright-core');
const base=process.env.QA_BASE_URL||'http://127.0.0.1:3098',host=process.env.QA_SUPABASE_HOST||'127.0.0.1';
const actor='00000000-0000-4000-8000-000000000001',foreign='00000000-0000-4000-8000-000000000002';
const checks=[];
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
for(const width of [390,1440])for(const mode of ['saved','unset','foreign','unavailable']){
 const ctx=await browser.newContext({viewport:{width,height:950}}),p=await ctx.newPage(),writes=[];
 const user={id:actor,aud:'authenticated',role:'authenticated',email:'fixture@example.test',user_metadata:{}};
 await ctx.addCookies([{name:'sb-'+host.split('.')[0]+'-auth-token',value:encodeURIComponent(JSON.stringify({access_token:'fixture-token',refresh_token:'fixture-refresh',expires_at:Math.floor(Date.now()/1000)+3600,user,token_type:'bearer'})),url:base}]);
 await ctx.route('**/*',async route=>{const q=route.request(),u=new URL(q.url());
  if(u.origin==='http://127.0.0.1:9'||u.hostname===host&&u.pathname.startsWith('/auth/')){
   if(u.pathname==='/auth/v1/user')return route.fulfill({json:{...user,...(q.method()==='PUT'?q.postDataJSON():{})}});
  }
  if(u.pathname.startsWith('/rest/v1/profiles')){
   if(q.method()==='PATCH'){writes.push(q.postDataJSON());assert(u.searchParams.get('id')==='eq.'+actor);return route.fulfill({json:{id:actor}});}
   return route.fulfill({json:{id:actor,full_name:'Personal name',company_name:'Retained legacy company',stripe_account_id:null}});
  }
  if(u.pathname==='/api/workspace-preferences')return route.fulfill({status:mode==='unavailable'?503:200,json:{ownerId:mode==='foreign'?foreign:actor,preferences:mode==='unset'?null:{business:'Workspace QA',profession:'Technology',goal:'clients'}}});
  if(u.pathname==='/api/stripe/subscription')return route.fulfill({json:{plan:'free',status:'none',canManage:false,canCancel:false}});
  if(u.origin!==base)return route.abort();return route.continue();
 });
 await p.goto(base+'/settings');await p.locator('#settings-full-name').waitFor();
 await p.waitForFunction(()=>document.querySelector('#settings-full-name')?.value==='Personal name');
 if(mode==='saved'){await p.waitForFunction(()=>document.querySelector('#settings-company-name')?.value==='Workspace QA');assert(await p.getByText(/Previous profile company name \(retained\)/).count());}
 else if(mode==='unset')await p.getByText('No workspace business name saved yet.',{exact:false}).waitFor();
 else await p.getByText('Workspace name unavailable.',{exact:false}).waitFor();
 assert.equal(await p.locator('#settings-company-name').inputValue(),mode==='saved'?'Workspace QA':'');
 assert.equal(await p.locator('#settings-company-name').getAttribute('readonly'),'');
 assert.equal(await p.getByRole('link',{name:'Edit business name in workspace setup'}).getAttribute('href'),'/workspace/setup?edit=1');
 if(mode==='saved'){await p.locator('#settings-full-name').fill('Changed personal name');p.once('dialog',d=>d.accept());await p.getByRole('button',{name:'Save Changes',exact:true}).click();await p.waitForTimeout(250);assert.deepEqual(writes,[{full_name:'Changed personal name'}]);}
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));checks.push({width,mode,passed:true});await ctx.close();
}
console.log(JSON.stringify({checks,scope:'Synthetic intercepted browser; not hosted permission proof'}));if(process.env.QA_OUT)fs.writeFileSync(process.env.QA_OUT+'/business-profile-browser.json',JSON.stringify({checks},null,2));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
