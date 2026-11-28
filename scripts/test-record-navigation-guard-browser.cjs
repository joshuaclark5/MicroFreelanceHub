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
  const id=n=>'aaaaaaaa-aaaa-4aaa-8aaa-'+String(n).padStart(12,'0'),actor=id(1);
  const data={clients:[{id:id(2),name:'Seed client',email:'',phone:'',notes:'',version:1}],stages:[{id:id(3),name:'Seed stage',position:0,version:1}],projects:[{id:id(4),name:'Seed project',client_id:id(2),stage_id:id(3),notes:'',status:'active',version:1}],tasks:[],agreements:[],'available-agreements':[{id:id(5),title:'Seed agreement',client_name:'Seed client',version:1}]};
  let writes=0,unexpectedWrites=0,mode='normal';const user={id:actor,email:'fixture@example.test',aud:'authenticated',role:'authenticated',user_metadata:{}};
  const cookie='sb-'+host.split('.')[0]+'-auth-token',value=encodeURIComponent(JSON.stringify({access_token:'fixture',refresh_token:'fixture',expires_at:4102444800,user,token_type:'bearer'}));
  await ctx.addInitScript(({cookie,value})=>Object.defineProperty(document,'cookie',{configurable:true,get:()=>cookie+'='+value,set:()=>{}}),{cookie,value});
  await ctx.route('**/*',async route=>{const req=route.request(),url=new URL(req.url());
   if(url.hostname===host&&url.pathname==='/auth/v1/user')return route.fulfill({json:user});
   if(url.origin===base&&url.pathname==='/api/workspace-preferences')return route.fulfill({json:{ownerId:actor,setupDismissed:false,preferences:{business:'Fixture',profession:'',goal:'clients'}}});
   if(url.origin===base&&url.pathname==='/api/workspace/session')return route.fulfill({json:{ownerId:actor}});
   if(url.origin===base&&url.pathname==='/api/workspace/email')return route.fulfill({json:{actorId:actor,records:[],hasMore:false,nextCursor:null}});
   const entity=url.pathname.split('/').pop();
   if(url.origin===base&&url.pathname.startsWith('/api/workspace/')&&data[entity]){
    if(req.method()==='GET')return route.fulfill({json:{ownerId:actor,records:[...data[entity]].sort((a,b)=>a.id.localeCompare(b.id)),complete:true,hasMore:false,nextCursor:null}});
    assert.equal(req.headers()['x-workspace-owner'],actor);writes++;
    if(mode==='uncertain')return route.fulfill({status:503,json:{error:'Fixture save uncertain'}});
    const input=req.postDataJSON();let record;
    if(req.method()==='PATCH'){
     record=data[entity].find(r=>r.id===url.searchParams.get('id'));
     if(String(record?.version)!==req.headers()['if-match'])return route.fulfill({status:409,json:{code:'version_conflict',error:'Fixture record changed. Reload and review.'}});
     Object.assign(record,input,{version:record.version+1});
    }else {assert.equal(req.method(),'POST');record={...input,id:id(100+writes),version:1};data[entity].push(record);}
    return route.fulfill({json:{ownerId:actor,record}});
   }
   if(!['GET','HEAD'].includes(req.method())){unexpectedWrites++;return route.abort();}
   if(url.origin!==base)return route.abort();
   if(url.pathname.startsWith('/api/'))return route.fulfill({status:503,json:{error:'Not available in fixture'}});
   return route.continue();
  });
  const modal=p.getByRole('dialog',{name:'Save your record changes?',exact:true});
  async function open(section){await p.goto(base+'/workspace/'+section);await p.getByRole('button',{name:section==='agreements'?'Link agreement':'Add '+(section==='stages'?'stage':section.slice(0,-1)),exact:true}).click();}
  async function fill(section,label){
   if(['clients','stages','projects'].includes(section))await p.getByLabel('Name',{exact:true}).fill(label);
   if(section==='tasks')await p.getByLabel('Task title',{exact:true}).fill(label);
   if(section==='projects'){await p.getByRole('combobox',{name:'Client',exact:true}).selectOption(id(2));await p.getByRole('combobox',{name:'Pipeline stage',exact:true}).selectOption(id(3));}
   if(['tasks','agreements'].includes(section))await p.getByRole('combobox',{name:'Project',exact:true}).selectOption(id(4));
   if(section==='agreements')await p.getByRole('combobox',{name:'Agreement',exact:true}).selectOption(id(5));
  }
  for(const section of ['clients','stages','projects','tasks','agreements']){
   const before=writes;await open(section);await fill(section,'Discard '+section);await p.getByRole('link',{name:'Overview',exact:true}).click();await modal.waitFor();await modal.getByRole('button',{name:'Keep editing',exact:true}).click();assert.equal(await p.locator('.suite-form').count(),1);
   await p.getByRole('link',{name:'Overview',exact:true}).click();await modal.getByRole('button',{name:'Discard changes',exact:true}).click();await p.waitForURL('**/workspace');assert.equal(writes,before);
   await open(section);await fill(section,'Saved '+section);await p.getByRole('link',{name:'Overview',exact:true}).click();await modal.getByRole('button',{name:'Save changes',exact:true}).click();await p.waitForURL('**/workspace');assert.equal(writes,before+1);assert.equal(data[section].length,section==='tasks'||section==='agreements'?1:2);
  }
  // Existing version gate must remain effective when Save is triggered by navigation.
  await p.goto(base+'/workspace/clients');await p.getByRole('button',{name:'Edit Seed client',exact:true}).click();await p.getByLabel('Name',{exact:true}).fill('Stale edit');data.clients[0].version++;data.clients[0].name='Newer saved name';const beforeConflict=writes;
  await p.getByRole('link',{name:'Overview',exact:true}).click();await modal.getByRole('button',{name:'Save changes',exact:true}).click();await modal.getByRole('alert').waitFor();assert.equal(writes,beforeConflict+1);assert.equal(data.clients[0].name,'Newer saved name');await modal.getByRole('button',{name:'Save changes',exact:true}).click();assert.equal(writes,beforeConflict+1);await modal.getByRole('button',{name:'Keep editing',exact:true}).click();assert.equal(await p.getByLabel('Name',{exact:true}).inputValue(),'Stale edit');await p.getByRole('button',{name:'Cancel',exact:true}).click();
  await open('clients');await fill('clients','Uncertain draft');mode='uncertain';const beforeUncertain=writes;await p.getByRole('link',{name:'Overview',exact:true}).click();await modal.getByRole('button',{name:'Save changes',exact:true}).click();await modal.getByRole('alert').waitFor();assert.equal(writes,beforeUncertain+1);await modal.getByRole('button',{name:'Save changes',exact:true}).click();assert.equal(writes,beforeUncertain+1);assert.equal(data.clients.some(r=>r.name==='Uncertain draft'),false);await modal.getByRole('button',{name:'Keep editing',exact:true}).click();assert.equal(await p.getByLabel('Name',{exact:true}).inputValue(),'Uncertain draft');mode='normal';await p.getByRole('button',{name:'Cancel',exact:true}).click();
  // Same-section navigation after Discard clears the old form, and the next form is guarded too.
  await open('clients');await fill('clients','Same-route discard');await p.getByRole('link',{name:'Open customer',exact:true}).first().click();await modal.getByRole('button',{name:'Discard changes',exact:true}).click();await p.waitForURL('**/workspace/clients?client=*');assert.equal(await p.locator('.suite-form').count(),0);await p.getByRole('button',{name:'Add client',exact:true}).click();await fill('clients','Next draft');await p.getByRole('link',{name:'Overview',exact:true}).click();await modal.waitFor();assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.screenshot({path:out+'.'+width+'.png',fullPage:true});await modal.getByRole('button',{name:'Keep editing',exact:true}).click();await p.getByRole('button',{name:'Cancel',exact:true}).click();assert.equal(unexpectedWrites,0);
  checks.push({width,fiveEntitySaveAndDiscard:true,keepEditing:true,versionConflictNoOverwrite:true,uncertainSaveNoRetry:true,sameRouteDiscardAndRearm:true,noOverflow:true,writes,unexpectedWrites});await p.close();
 }
}catch(e){fs.writeFileSync(out+'.error.txt',String(e.stack||e));for(const [i,p]of pages.entries())if(!p.isClosed())try{fs.writeFileSync(out+'.failure-'+i+'.txt',await p.locator('body').innerText({timeout:5000}));await p.screenshot({path:out+'.failure-'+i+'.png',fullPage:true,timeout:5000});}catch{}throw e;}finally{for(const context of contexts)await context.close();await browser.close();fs.writeFileSync(out,JSON.stringify({checks,scope:'Isolated fictional identities and intercepted profile/visibility saves; no hosted mutations'},null,2));}console.log(JSON.stringify(checks));})().catch(e=>{console.error(e.stack);process.exitCode=1});
