// Rasterize our repository-owned SVG for native assets; no external image service.
const fs=require('fs'),path=require('path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/joshu/AppData/Roaming/npm/node_modules/openclaw/node_modules/playwright-core');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const svg=fs.readFileSync('public/brand/mark.svg','utf8');fs.mkdirSync('mobile/assets',{recursive:true});
 for(const [size,file,bg] of [[256,'brand-mark.png','transparent'],[1024,'icon.png','#123E35']]){
 const page=await browser.newPage({viewport:{width:size,height:size},deviceScaleFactor:1});
 await page.setContent('<style>html,body{margin:0;width:100%;height:100%;background:'+bg+'}svg{width:100%;height:100%;display:block}</style>'+svg);
 await page.screenshot({path:path.join('mobile/assets',file),omitBackground:bg==='transparent'});await page.close();
 }
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
