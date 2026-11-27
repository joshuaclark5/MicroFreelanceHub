const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/joshu/AppData/Roaming/npm/node_modules/openclaw/node_modules/playwright-core');
const base=process.env.QA_BASE_URL,host=process.env.QA_SUPABASE_HOST;
if(!base||!host)throw Error('Explicit verified origin and Supabase host required');
const actor='00000000-0000-4000-8000-000000000001',checks=[];
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 for(const width of [390,1440]){
  const ctx=await browser.newContext({viewport:{width,height:1000}}),p=await ctx.newPage();
  const user={id:actor,aud:'authenticated',role:'authenticated',email:'fixture@example.test',user_metadata:{}};
  let preferences=null,fail=true,writes=0;
  await ctx.addCookies([{name:'sb-'+host.split('.')[0]+'-auth-token',value:encodeURIComponent(JSON.stringify({access_token:'fixture-token',refresh_token:'fixture-refresh',expires_at:Math.floor(Date.now()/1000)+3600,user,token_type:'bearer'})),url:base}]);
  await ctx.route('**/*',async route=>{const q=route.request(),u=new URL(q.url());
   if(u.hostname===host){if(u.pathname==='/auth/v1/user')return route.fulfill({json:user});return route.fulfill({json:[]});}
   if(u.origin!==base)return route.abort();
   if(u.pathname==='/api/workspace-preferences'){
    if(q.method()==='POST'){writes++;const payload=q.postDataJSON();assert.equal(payload.expectedOwner,actor);
     if(fail)return route.fulfill({status:503,json:{error:'Synthetic save failure'}});preferences=payload.preferences;
    }
    return route.fulfill({json:{ownerId:actor,preferences}});
   }
   if(u.pathname.startsWith('/api/'))return route.fulfill({status:503,json:{error:'Unrelated service unavailable in fixture'}});
   if(!['GET','HEAD'].includes(q.method()))return route.abort();return route.continue();
  });
  await p.goto(base+'/workspace/setup?edit=1');const field=p.getByLabel('Business or display name');await field.fill('Synthetic save exit');
  await p.getByRole('button',{name:'Save and exit',exact:true}).click();await p.getByRole('alert').filter({hasText:'Synthetic save failure'}).waitFor();assert.equal(writes,1);assert.equal(await field.inputValue(),'Synthetic save exit');assert(p.url().includes('/workspace/setup'));
  fail=false;await p.getByRole('button',{name:'Save and exit',exact:true}).click();await p.waitForURL(base+'/workspace');assert.equal(writes,2);assert.equal(preferences.business,'Synthetic save exit');
  await p.goto(base+'/workspace/setup?edit=1');await field.waitFor();assert.equal(await field.inputValue(),'Synthetic save exit');await p.getByRole('button',{name:'Continue',exact:true}).click();await p.getByRole('button',{name:'Save and exit',exact:true}).click();await p.waitForURL(base+'/workspace');assert.equal(writes,3);
  await p.goto(base+'/workspace/setup?edit=1');await field.waitFor();await p.getByRole('link',{name:'Skip for now',exact:true}).click();await p.waitForURL(base+'/workspace');assert.equal(writes,3);
  checks.push({width,firstStageExit:true,secondStageExit:true,failureRetainsInput:true,reload:true,skipDoesNotSave:true,provider:'mocked'});await ctx.close();
 }
}finally{await browser.close();if(process.env.QA_OUT)fs.writeFileSync(process.env.QA_OUT+'/save-exit-browser.json',JSON.stringify({checks},null,2));}
console.log(JSON.stringify({checks}));})().catch(e=>{console.error(e);process.exitCode=1;});
