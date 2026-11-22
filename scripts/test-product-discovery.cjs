const assert=require('assert/strict');
const {chromium}=require('C:/Users/joshu/AppData/Roaming/npm/node_modules/openclaw/node_modules/playwright-core');
const base=process.env.QA_BASE_URL||'http://127.0.0.1:3079';
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 for(const width of [320,390,1440]){
  const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await context.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
  for(const path of ['/','/features','/support','/security']){
   const response=await page.goto(base+path);assert.equal(response.status(),200);
   await page.getByRole('heading',{level:1}).waitFor();
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow '+path+' '+width);
   assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'),'https://www.microfreelancehub.com'+(path==='/'?'':path));
   if(path==='/features')assert.equal(await page.locator('main article a[href^="/workspace/"], main article a[href="/dashboard"]').count(),6);
   if(path==='/support'){
    await page.getByLabel('Find an answer').fill('recurring');
    await page.getByText('Will recurring invoices automatically charge clients?',{exact:true}).click();
    assert.ok(await page.getByText('No. Recurring drafts require manual review.',{exact:false}).isVisible());
    await page.getByLabel('Find an answer').fill('zzzz-no-answer');
    assert.ok(await page.getByText('No reviewed answer matches.',{exact:false}).isVisible());
    assert.ok(await page.getByRole('link',{name:'support@microfreelancehub.com',exact:true}).isVisible());
    await page.getByLabel('What do you need help with?').selectOption('Time tracking');
    await page.getByLabel('What happened?',{exact:true}).fill('Save failed & retry?\nSecond line');
    const draftUrl = await page.getByRole('link',{name:'Open email draft',exact:true}).getAttribute('href');
    const draft = new URL(draftUrl);
    assert.equal(draft.protocol,'mailto:');
    assert.equal(draft.pathname,'support@microfreelancehub.com');
    assert.equal(draft.searchParams.get('subject'),'MicroFreelanceHub help: Time tracking');
    assert.ok(draft.searchParams.get('body').includes('Save failed & retry?\nSecond line'));
    assert.ok(!draft.searchParams.get('body').includes('zzzz-no-answer'));
    await page.getByText('Review email draft',{exact:true}).click();
    assert.ok(await page.locator('pre').isVisible());
    await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('denied');}}}));
    await page.getByRole('button',{name:'Copy draft',exact:true}).click();
    await page.getByRole('status').filter({hasText:'Copy is unavailable.'}).waitFor();
    await page.getByRole('button',{name:'Clear draft',exact:true}).click();
    assert.equal(await page.getByLabel('What happened?',{exact:true}).inputValue(),'');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   }
  }
  assert.deepEqual(errors,[]);await context.close();
 }
 console.log('PASS four public routes at 320/390/1440px; canonicals; feature destinations; support search, honest fallback and escalation; no page errors.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
