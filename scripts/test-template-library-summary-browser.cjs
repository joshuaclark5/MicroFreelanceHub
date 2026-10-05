const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { chromium } = require('C:/Users/joshu/AppData/Roaming/npm/node_modules/openclaw/node_modules/playwright-core');
const e = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/lib/templateLibrarySummary.ts','utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, { exports: e });
const base = process.env.QA_BASE_URL || 'https://www.microfreelancehub.com';
const baseline = process.env.QA_BASELINE === '1';
const dir = process.env.QA_EVIDENCE_DIR;
assert.ok(dir, 'Set QA_EVIDENCE_DIR');
(async () => {
  const browser = await chromium.launch({channel:'msedge',headless:true});
  try {
    const report = { checkedAt:new Date().toISOString(),base,viewports:[] };
    const old = baseline ? null : JSON.parse(fs.readFileSync(path.join(dir,'baseline.json'),'utf8'));
    for (const width of [1440,390,320]) {
      const page = await browser.newPage({viewport:{width,height:950}});
      const errors = [];
      page.on('pageerror',error=>errors.push(error.message));
      await page.route('**/*',route=>{
        const r=route.request();
        if (/google-analytics|googletagmanager/.test(r.url())) return route.abort();
        if (!['GET','HEAD','OPTIONS'].includes(r.method())) return route.fulfill({status:200,contentType:'application/json',body:'{}'});
        return route.continue();
      });
      const [response] = await Promise.all([page.goto(base+'/templates'), page.waitForResponse(r => r.url().includes('/api/templates?') && r.status() === 200)]);
      assert.equal(response.status(),200);
      await page.waitForFunction(()=>document.querySelectorAll('main a.group').length===48 && !Array.from(document.querySelectorAll('p')).some(p=>p.textContent==='Loading...'));
      const cards = await page.locator('main a.group').evaluateAll(es=>es.map(el=>({path:new URL(el.href).pathname,title:el.querySelector('h2').textContent,summary:el.querySelector('p').textContent})));
      const canonical=await page.locator('link[rel=canonical]').evaluateAll(es=>es.map(el=>el.href));
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      assert.deepEqual(errors,[]);
      if (!baseline) {
        const prev=old.viewports.find(v=>v.width===width);
        assert.deepEqual(cards,prev.cards.map(c=>({...c,summary:e.templateLibrarySummary(c.summary)})));
        assert.deepEqual(canonical,prev.canonical);
      }
      await page.screenshot({path:path.join(dir,(baseline?'baseline':'local')+'-'+width+'.png'),fullPage:false});
      report.viewports.push({width,cards,canonical,errors});
      if (!baseline) {
        const fixtures=[
          {slug:'mock-risk',job_title:'Example',document_type:'Contract',ai_summary:'This contract guarantees you get paid.'},
          {slug:'mock-safe',job_title:'Example',document_type:'Invoice',ai_summary:'Record invoice numbers and payment details.'},
          {slug:'mock-empty',job_title:'Example',document_type:'Scope',ai_summary:null}
        ];
        await page.route('**/api/templates?**',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({templates:fixtures,total:3})}));
        await page.getByRole('textbox',{name:'Search templates'}).fill('mock');
        await page.waitForFunction(()=>document.querySelectorAll('main a.group').length===3);
        assert.deepEqual(await page.locator('main a.group p').allTextContents(),fixtures.map(f=>e.templateLibrarySummary(f.ai_summary)));
        assert.deepEqual(errors,[]);
      }
      await page.close();
    }
    const page=await browser.newPage();
    const sitemap=await page.request.get(base+'/sitemap.xml');
    assert.equal(sitemap.status(),200);
    report.urls=Array.from((await sitemap.text()).matchAll(/<loc>(.*?)<\/loc>/g),m=>m[1]).sort();
    assert.equal(report.urls.length,1511);
    if (!baseline) assert.deepEqual(report.urls,old.urls);
    fs.writeFileSync(path.join(dir,baseline?'baseline.json':'local.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify({base,viewports:report.viewports.map(v=>v.width),cards:48,sitemap:report.urls.length,mockedSearch:!baseline}));
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
