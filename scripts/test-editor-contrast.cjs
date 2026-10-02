// Set QA_BASELINE=1 and QA_BASE_URL to production to capture the baseline in QA_EVIDENCE_DIR.
// Then unset QA_BASELINE and set QA_BASE_URL to the ready local production server.
// Both runs use public, unauthenticated pages; analytics and browser writes are blocked.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('C:/Users/joshu/AppData/Roaming/npm/node_modules/openclaw/node_modules/playwright-core');
const base=process.env.QA_BASE_URL||'http://127.0.0.1:3043';
const baseline=process.env.QA_BASELINE==='1';
const evidence=process.env.QA_EVIDENCE_DIR||'.';
const measure=el=>{
 const rgb=s=>s.match(/[\d.]+/g).map(Number);
 const fg=rgb(getComputedStyle(el).color); const layers=[]; let p=el;
 while(p){const style=getComputedStyle(p);if(Number(style.opacity)!==1)throw Error('Unsupported element opacity');layers.push(rgb(style.backgroundColor));p=p.parentElement;}
 let bg=[255,255,255];for(const c of layers.reverse()){const alpha=c.length===3?1:c[3];bg=bg.map((v,i)=>c[i]*alpha+v*(1-alpha));}
 const lum=c=>c.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
 const a=lum(fg),b=lum(bg);
 return {text:el.textContent.trim(),foreground:fg,background:bg,ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
};
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
 const report={checkedAt:new Date().toISOString(),base,viewports:[]};
 for(const width of [1440,390]){
 const page=await browser.newPage({viewport:{width,height:950}});
 await page.route('**/*',route=>{const r=route.request();if(/google-analytics|googletagmanager/.test(r.url()))return route.abort();if(!['GET','HEAD','OPTIONS'].includes(r.method()))return route.fulfill({status:200,contentType:'application/json',body:'{}'});return route.continue();});
 const response=await page.goto(base+'/create?mode=editor'); assert.equal(response.status(),200);
 await page.getByLabel('Manual Total Price',{exact:true}).waitFor();
 const label=page.locator('label[for="manual-total"]');
 const notice=page.locator('p').filter({hasText:'By clicking Save, you agree'});
 const results=[];
 for(const el of [label,notice,notice.getByRole('link',{name:'Terms',exact:true})]){
 const m=await el.evaluate(measure);results.push(m);if(!baseline)assert.ok(m.ratio>=4.5, m.text+': '+m.ratio);
 }
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:evidence+'/editor-contrast-'+(baseline?'baseline':'verified')+'-'+width+'.png',fullPage:true});
 report.viewports.push({width,results,canonical:await page.locator('link[rel="canonical"]').evaluateAll(es=>es.map(e=>e.href))});
 await page.close();
 }
 const page=await browser.newPage();
 const r=await page.request.get(base+'/sitemap.xml');assert.equal(r.status(),200);
 report.urls=Array.from((await r.text()).matchAll(/<loc>(.*?)<\/loc>/g),m=>m[1]).sort();
 assert.equal(report.urls.length,1511);
 const file=evidence+'/editor-contrast-baseline.json';
 if(!baseline){const prior=JSON.parse(fs.readFileSync(file,'utf8'));assert.deepEqual(report.urls,prior.urls);assert.deepEqual(report.viewports.map(v=>v.canonical),prior.viewports.map(v=>v.canonical));}
 fs.writeFileSync(evidence+'/editor-contrast-'+(baseline?'baseline':'verified')+'.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify({base,viewports:report.viewports,sitemap:report.urls.length}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});