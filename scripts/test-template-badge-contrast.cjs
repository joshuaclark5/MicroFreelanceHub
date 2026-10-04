const assert=require('node:assert/strict');const fs=require('node:fs');
const {chromium}=require('C:/Users/joshu/AppData/Roaming/npm/node_modules/openclaw/node_modules/playwright-core');
const base=process.env.QA_BASE_URL||'https://www.microfreelancehub.com';const baseline=process.env.QA_BASELINE==='1';const evidence=process.env.QA_EVIDENCE_DIR||'.';
const measure=el=>{
 const rgb=s=>s.match(/[\d.]+/g).map(Number);
 const fg=rgb(getComputedStyle(el).color); const layers=[]; let p=el;
 while(p){const style=getComputedStyle(p);if(Number(style.opacity)!==1)throw Error('Unsupported element opacity');layers.push(rgb(style.backgroundColor));p=p.parentElement;}
 let bg=[255,255,255];for(const c of layers.reverse()){const alpha=c.length===3?1:c[3];bg=bg.map((v,i)=>c[i]*alpha+v*(1-alpha));}
 const lum=c=>c.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
 const a=lum(fg),b=lum(bg);
 return {text:el.textContent.trim(),foreground:fg,background:bg,ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
};

(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
const report={checkedAt:new Date().toISOString(),base,viewports:[]};
for(const width of [1440,390,320]){const page=await browser.newPage({viewport:{width,height:950}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/*',route=>{const r=route.request();if(/google-analytics|googletagmanager/.test(r.url()))return route.abort();if(!['GET','HEAD','OPTIONS'].includes(r.method()))return route.fulfill({status:200,contentType:'application/json',body:'{}'});return route.continue();});
const response=await page.goto(base+'/templates');assert.equal(response.status(),200);await page.getByRole('heading',{name:'Template Library',exact:true}).waitFor();
await page.waitForFunction(()=>document.querySelectorAll('main a.group span.rounded-full').length===48 && !Array.from(document.querySelectorAll('p')).some(p=>p.textContent==='Loading...'));
const badges=page.locator('main a.group span.rounded-full');const results=[];for(const el of await badges.all()){const m=await el.evaluate(measure);results.push(m);if(!baseline)assert.ok(m.ratio>=4.5,m.text+': '+m.ratio);}assert.equal(results.length,48);
assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
const canonical=await page.locator('link[rel=canonical]').evaluateAll(es=>es.map(e=>e.href));const links=await page.locator('main a').evaluateAll(es=>es.map(e=>new URL(e.href).pathname));
await page.screenshot({path:evidence+'/template-badges-'+(baseline?'baseline':'verified')+'-'+width+'.png',fullPage:false});report.viewports.push({width,results,canonical,links});await page.close();}
const p=await browser.newPage();const r=await p.request.get(base+'/sitemap.xml');assert.equal(r.status(),200);report.urls=Array.from((await r.text()).matchAll(/<loc>(.*?)<\/loc>/g),m=>m[1]).sort();assert.equal(report.urls.length,1511);
if(!baseline){const old=JSON.parse(fs.readFileSync(evidence+'/template-badges-baseline.json','utf8'));assert.deepEqual(report.urls,old.urls);assert.deepEqual(report.viewports.map(v=>({canonical:v.canonical,links:v.links})),old.viewports.map(v=>({canonical:v.canonical,links:v.links})));}
fs.writeFileSync(evidence+'/template-badges-'+(baseline?'baseline':'verified')+'.json',JSON.stringify(report,null,2));console.log(JSON.stringify({base,sitemap:report.urls.length,viewports:report.viewports.map(v=>({width:v.width,badges:v.results.length,minContrast:Math.min(...v.results.map(m=>m.ratio))}))}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});