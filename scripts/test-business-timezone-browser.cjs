const fs=require('fs'),assert=require('node:assert/strict'),{chromium}=require('C:/Users/joshu/AppData/Roaming/npm/node_modules/openclaw/node_modules/playwright-core');
const base=process.env.QA_BASE_URL,host=process.env.QA_SUPABASE_HOST,out=process.env.QA_RECEIPT;if(!base||!host||!out||fs.existsSync(out))throw Error('Verified target and fresh receipt required');
const checks=[];
(async()=>{const browser=await chromium.connectOverCDP('http://127.0.0.1:18900'),context=browser.contexts()[0],owned=[];try{
 for(const zone of ['UTC','America/Los_Angeles'])for(const width of [390,1440]){
  const p=await context.newPage();owned.push(p);await p.setViewportSize({width,height:950});const cdp=await context.newCDPSession(p);await cdp.send('Emulation.setTimezoneOverride',{timezoneId:zone});await p.clock.install({time:new Date('2026-03-08T07:30:00Z')});
  const actor='aaaaaaaa-aaaa-4aaa-8aaa-000000000001';let prefs=null,fail=true,saves=0,unexpectedWrites=0;
  const user={id:actor,email:'fixture@example.test',aud:'authenticated',role:'authenticated',user_metadata:{}};
  const cookie='sb-'+host.split('.')[0]+'-auth-token',value=encodeURIComponent(JSON.stringify({access_token:'fixture',refresh_token:'fixture',expires_at:4102444800,user,token_type:'bearer'}));
  await p.addInitScript(({cookie,value})=>Object.defineProperty(document,'cookie',{configurable:true,get:()=>cookie+'='+value,set:()=>{}}),{cookie,value});
  const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.route('**/*',async route=>{const q=route.request(),u=new URL(q.url());
   if(u.hostname===host&&u.pathname==='/auth/v1/user')return route.fulfill({json:{...user,user_metadata:{mfh_workspace:prefs}}});
   if(u.origin===base&&u.pathname==='/api/workspace-preferences'){
    if(q.method()==='POST'){saves++;const body=q.postDataJSON();assert.equal(body.expectedOwner,actor);if(fail)return route.fulfill({status:503,json:{error:'Fixture save unavailable'}});prefs=body.preferences;}
    return route.fulfill({json:{ownerId:actor,preferences:prefs}});
   }
   if(!['GET','HEAD'].includes(q.method())){unexpectedWrites++;return route.abort();}
   if(u.hostname===host&&u.pathname==='/rest/v1/profiles')return route.fulfill({json:{is_pro:false}});
   if(u.origin!==base)return route.abort();
   if(u.pathname==='/api/workspace-scheduling')return route.fulfill({json:{actorId:actor,businessTimezone:prefs?.timezone||null,availability:[],intakes:[],bookings:[],truncated:false}});
   if(u.pathname==='/api/workspace/email')return route.fulfill({json:{actorId:actor,records:[],hasMore:false,nextCursor:null}});
   if(u.pathname==='/api/workspace/session')return route.fulfill({json:{ownerId:actor}});
   if(u.pathname.startsWith('/api/workspace/'))return route.fulfill({json:{ownerId:actor,records:[],complete:true,hasMore:false,nextCursor:null}});
   if(u.pathname.startsWith('/api/'))return route.fulfill({status:503,json:{error:'Fixture unavailable'}});
   return route.continue();
  });
  await p.goto(base+'/workspace/setup?edit=1',{waitUntil:'domcontentloaded'});const input=p.getByRole('combobox',{name:'Business timezone',exact:true});await input.waitFor();
  await p.getByText('Example local time:',{exact:false}).waitFor();assert.match(await p.getByText('Example local time:',{exact:false}).innerText(),new RegExp(zone.replace('/','\\/')));assert.equal(saves,0);
  await p.getByLabel('Business or display name').fill('Timezone fixture');
  const type=p.getByLabel('Business type (optional)',{exact:true});assert.equal(await type.inputValue(),'');assert.deepEqual(await type.locator('option').allTextContents(),['Choose a business type','Cleaning','Trades','Design','Photography','Consulting','Coaching','Events','Other','Prefer not to say']);
  await type.selectOption('Other');await p.getByLabel('Describe your business (optional)').fill('Woodworking');
  await p.getByLabel('Legal business name (optional)').fill('Fixture Studio LLC');await p.getByLabel('Website (optional)').fill('javascript:alert(1)');await p.getByLabel('Reply-to email (optional)').fill('bad@');await p.getByRole('button',{name:'Save and exit',exact:true}).click();assert.equal(saves,0);await p.getByText('Enter a complete http:// or https:// website URL.',{exact:true}).waitFor();await p.getByText('Enter a valid reply-to email address.',{exact:true}).waitFor();
  await p.getByLabel('Website (optional)').fill('https://example.test');await p.getByLabel('Reply-to email (optional)').fill('fixture@example.test');await input.fill('Los Angeles');await p.getByRole('option').filter({hasText:'America/Los_Angeles'}).click();
  await p.getByRole('button',{name:'Save and exit',exact:true}).click();await p.getByRole('alert').filter({hasText:'Fixture save unavailable'}).waitFor();assert.equal(saves,1);assert.match(await input.inputValue(),/Los Angeles/);
  fail=false;await p.getByRole('button',{name:'Save and exit',exact:true}).click();await p.waitForURL('**/workspace');assert.equal(prefs.timezone,'America/Los_Angeles');assert.equal(prefs.legalBusinessName,'Fixture Studio LLC');assert.equal(prefs.website,'https://example.test');assert.equal(prefs.replyToEmail,'fixture@example.test');assert.equal(prefs.businessType,'Other');assert.equal(prefs.businessTypeOther,'Woodworking');assert.equal(saves,2);
  await p.getByText('your saved business timezone (America/Los_Angeles)',{exact:false}).waitFor();await p.waitForFunction(()=>document.body.innerText.includes('2026-03-07'));assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await p.goto(base+'/workspace/setup?edit=1',{waitUntil:'domcontentloaded'});await input.waitFor();assert.match(await input.inputValue(),/Los Angeles/);assert.equal(await type.inputValue(),'Other');assert.equal(await p.getByLabel('Describe your business (optional)').inputValue(),'Woodworking');assert.equal(await p.getByLabel('Website (optional)').inputValue(),'https://example.test');await input.fill('Tokyo');await p.getByRole('option').filter({hasText:'Asia/Tokyo'}).click();assert.equal(saves,2);
  await p.goto(base+'/workspace/scheduling',{waitUntil:'domcontentloaded'});const hostInput=p.getByRole('combobox',{name:'Host timezone',exact:true});await hostInput.waitFor();await p.waitForFunction(()=>document.querySelector('[role="combobox"]')?.value.includes('Los Angeles'));assert.equal(saves,2);
  await p.goto(base+'/workspace/setup?edit=1',{waitUntil:'domcontentloaded'});await input.waitFor();assert.match(await input.inputValue(),/Los Angeles/);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.screenshot({path:out+'.'+zone.replaceAll('/','-')+'.'+width+'.png',fullPage:true});
  assert.equal(unexpectedWrites,0);assert.equal(errors.length,0,errors.join('\n'));checks.push({zone,width,optionalBusinessDetails:true,fieldLevelValidation:true,exactBusinessTypes:true,browserSuggestion:true,noAutosave:true,failedSaveRetainsSelection:true,explicitSaveReload:true,savedBusinessDay:true,unsavedChoiceNotUsedForScheduling:true,noOverflow:true,saves,unexpectedWrites});await p.close();
 }
}finally{for(const p of owned)if(!p.isClosed())await p.close();await browser.close();fs.writeFileSync(out,JSON.stringify({checks,scope:'Fictional page-scoped identity and intercepted saves only; no hosted writes'},null,2));}console.log(JSON.stringify(checks));})().catch(e=>{console.error(e.stack);process.exitCode=1;});
