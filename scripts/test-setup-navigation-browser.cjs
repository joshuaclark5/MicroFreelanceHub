const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('C:/Users/joshu/AppData/Roaming/npm/node_modules/openclaw/node_modules/playwright-core');
const base=process.env.QA_BASE_URL,host=process.env.QA_SUPABASE_HOST,out=process.env.QA_RECEIPT,deployment=process.env.QA_DEPLOYMENT;
if(!base||!host||!out||!deployment||fs.existsSync(out))throw Error('Exact target and fresh receipt required');
const checks=[];
(async()=>{const connection=await chromium.connectOverCDP('http://127.0.0.1:18900',{timeout:30000});let cookies=(await connection.contexts()[0].cookies()).filter(c=>c.domain.endsWith('vercel.app')||c.domain.endsWith('vercel.com'));await connection.close();const browser=await chromium.launch({channel:'msedge',headless:true}),contexts=[],pages=[];try{
 const verify=await browser.newContext({storageState:{cookies,origins:[]}});contexts.push(verify);const probe=await verify.newPage();pages.push(probe);await probe.goto(base+'/workspace/setup?edit=1',{waitUntil:'domcontentloaded'});await probe.getByRole('heading',{name:'Your next chapter starts here.',exact:true}).waitFor();assert.equal(new URL(probe.url()).origin,base);
 const html=await (await verify.request.get(base+'/workspace/setup?edit=1')).text(),urls=[...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map(m=>new URL(m[1].replaceAll('&amp;','&'),base).href).filter(u=>new URL(u).origin===base),hosts=new Set();assert(urls.some(u=>u.includes('dpl_'+deployment)));
 for(const url of urls){const response=await verify.request.get(url);assert.equal(response.status(),200);const text=await response.text();for(const match of text.matchAll(/[a-z0-9]+\.supabase\.co/g))hosts.add(match[0]);}assert.deepEqual([...hosts],[host]);fs.writeFileSync(out+'.code.json',JSON.stringify({base,deployment,hosts:[...hosts],urls},null,2));cookies=(await verify.cookies()).filter(c=>c.domain.endsWith('vercel.app')||c.domain.endsWith('vercel.com'));await probe.close();

 for(const width of [360,390,1440]){
  const ctx=await browser.newContext({viewport:{width,height:950},storageState:{cookies,origins:[]}});contexts.push(ctx);const p=await ctx.newPage();pages.push(p);
  const actor='aaaaaaaa-aaaa-4aaa-8aaa-000000000001';let prefs={business:'Saved fixture',profession:'Technology',goal:'clients',timezone:'UTC',country:'US',currency:'USD'},writes=0,unexpectedWrites=0,fail=false,releaseSave;
  const user={id:actor,email:'fixture@example.test',aud:'authenticated',role:'authenticated',user_metadata:{}};
  const cookie='sb-'+host.split('.')[0]+'-auth-token',value=encodeURIComponent(JSON.stringify({access_token:'fixture',refresh_token:'fixture',expires_at:4102444800,user,token_type:'bearer'}));
  await ctx.addInitScript(({cookie,value})=>Object.defineProperty(document,'cookie',{configurable:true,get:()=>cookie+'='+value,set:()=>{}}),{cookie,value});
  await ctx.route('**/*',async route=>{const req=route.request(),url=new URL(req.url());
   if(url.hostname===host&&url.pathname==='/auth/v1/user')return route.fulfill({json:{...user,user_metadata:{mfh_workspace:prefs}}});
   if(url.origin===base&&url.pathname==='/api/workspace-preferences'){
    if(req.method()==='POST'){writes++;const body=req.postDataJSON();assert.equal(body.expectedOwner,actor);if(fail)return route.fulfill({status:503,json:{error:'Fixture save unavailable'}});await new Promise(resolve=>{releaseSave=resolve});prefs=body.preferences;}
    return route.fulfill({json:{ownerId:actor,preferences:prefs}});
   }
   if(!['GET','HEAD'].includes(req.method())){unexpectedWrites++;return route.abort();}
   if(url.origin!==base)return route.abort();
   if(url.pathname==='/api/workspace/session')return route.fulfill({json:{ownerId:actor}});
   if(url.pathname==='/api/workspace/email')return route.fulfill({json:{actorId:actor,records:[],hasMore:false,nextCursor:null}});
   if(url.pathname.startsWith('/api/workspace/'))return route.fulfill({json:{ownerId:actor,records:[],complete:true,hasMore:false,nextCursor:null}});
   if(url.pathname.startsWith('/api/'))return route.fulfill({status:503,json:{error:'Not available in fixture'}});
   return route.continue();
  });
  await p.goto(base+'/workspace/setup?edit=1');const field=p.getByLabel('Business or display name');await field.waitFor();assert.equal(await field.inputValue(),'Saved fixture');
  await p.getByRole('link',{name:'Skip for now',exact:true}).click();await p.waitForURL('**/workspace');assert.equal(writes,0);
  await p.goto(base+'/workspace/setup?edit=1');await field.fill('Unsaved fixture');const back=p.getByRole('link',{name:'Back to Home',exact:true});await back.focus();await p.keyboard.press('Enter');const modal=p.getByRole('dialog',{name:'Save your setup changes?',exact:true});await modal.waitFor();assert.equal(await p.evaluate(()=>document.activeElement.textContent),'Keep editing');
  await p.keyboard.press('Escape');assert.equal(await modal.count(),0);assert.equal(await field.inputValue(),'Unsaved fixture');assert.equal(await p.evaluate(()=>document.activeElement.textContent),'Back to Home');
  await back.click();fail=true;await modal.getByRole('button',{name:'Save changes',exact:true}).click();await modal.getByRole('alert').waitFor();assert.equal(await field.inputValue(),'Unsaved fixture');assert.equal(prefs.business,'Saved fixture');assert.equal(writes,1);
  await modal.getByRole('button',{name:'Keep editing',exact:true}).click();await field.fill('Saved through guard');await back.click();fail=false;await modal.getByRole('button',{name:'Save changes',exact:true}).click();await p.waitForFunction(()=>document.querySelector('dialog[open] button')?.disabled);assert(await modal.getByRole('button',{name:'Discard changes',exact:true}).isDisabled());assert.equal(writes,2);releaseSave();await p.waitForURL('**/workspace');assert.equal(prefs.business,'Saved through guard');
  await p.goto(base+'/workspace/setup?edit=1');assert.equal(await field.inputValue(),'Saved through guard');await field.fill('Discarded fixture');await back.click();await modal.getByRole('button',{name:'Discard changes',exact:true}).click();await p.waitForURL('**/workspace');assert.equal(writes,2);assert.equal(prefs.business,'Saved through guard');
  await p.goto(base+'/workspace/setup?edit=1');await field.waitFor();await p.reload();await field.waitFor();await back.click();await p.waitForURL('**/workspace');assert.equal(writes,2);
  await p.goto(base+'/workspace/setup?edit=1');await field.fill('Screenshot fixture');await back.click();await modal.waitFor();assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.screenshot({path:out+'.'+width+'.png',fullPage:true});await modal.getByRole('button',{name:'Keep editing',exact:true}).click();assert.equal(unexpectedWrites,0);
  // Genuine App Router history: cancellation must preserve the form and prior list query.
  await p.goto(base+'/workspace?search=retained&sort=name&page=3');
  await p.getByRole('link',{name:'Personalize your workspace',exact:true}).click();await field.waitFor();const historyLength=await p.evaluate(()=>history.length);await field.fill('History edit');
  await p.goBack({waitUntil:'commit',timeout:1500}).catch(e=>{if(!/Timeout|ERR_ABORTED/.test(String(e)))throw e;});await modal.waitFor();assert.equal(await field.inputValue(),'History edit');assert.equal(new URL(p.url()).pathname,'/workspace/setup');await modal.getByRole('button',{name:'Keep editing',exact:true}).click();assert.equal(await p.evaluate(()=>history.length),historyLength);
  await p.goBack({waitUntil:'commit',timeout:1500}).catch(e=>{if(!/Timeout|ERR_ABORTED/.test(String(e)))throw e;});await modal.waitFor();await modal.getByRole('button',{name:'Discard changes',exact:true}).click();await p.waitForURL('**/workspace?search=retained&sort=name&page=3');assert.equal(writes,2);assert.equal(await p.evaluate(()=>history.length),historyLength);
  await p.goForward({waitUntil:'domcontentloaded'});await field.waitFor();assert.equal(await field.inputValue(),'Saved through guard');await field.fill('History saved fixture');
  await p.goBack({waitUntil:'commit',timeout:1500}).catch(e=>{if(!/Timeout|ERR_ABORTED/.test(String(e)))throw e;});await modal.waitFor();await modal.getByRole('button',{name:'Save changes',exact:true}).click();await p.waitForFunction(()=>document.querySelector('dialog[open] button')?.disabled);assert.equal(writes,3);releaseSave();await p.waitForURL('**/workspace?search=retained&sort=name&page=3');assert.equal(prefs.business,'History saved fixture');assert.equal(await p.evaluate(()=>history.length),historyLength);
  checks.push({width,historyBackKeepAndDiscard:true,historyBackSave:true,forwardLoadsSavedData:true,historyLengthPreserved:true,listQueryPreserved:true,pristineNoPrompt:true,keyboardFocusAndEscape:true,failedSaveRetention:true,duplicateDisabled:true,saveThenIntendedDestination:true,discardNoWrite:true,reloadClean:true,noOverflow:true,writes,unexpectedWrites});await p.close();
 }
}catch(e){fs.writeFileSync(out+'.error.txt',String(e.stack||e));for(const [i,p]of pages.entries())if(!p.isClosed())try{fs.writeFileSync(out+'.failure-'+i+'.txt',await p.locator('body').innerText({timeout:5000}));await p.screenshot({path:out+'.failure-'+i+'.png',fullPage:true,timeout:5000});}catch{}throw e;}finally{for(const context of contexts)await context.close();await browser.close();fs.writeFileSync(out,JSON.stringify({checks,scope:'Isolated fictional identities and intercepted profile/visibility saves; no hosted mutations'},null,2));}console.log(JSON.stringify(checks));})().catch(e=>{console.error(e.stack);process.exitCode=1});
