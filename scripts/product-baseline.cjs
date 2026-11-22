// Read-only public baseline. Writes evidence outside the repository.
const fs = require('node:fs'), crypto = require('node:crypto');
const out = process.argv[2];
if (!out) throw Error('Provide a private evidence output path.');
const origin = 'https://www.microfreelancehub.com';
async function get(path) {
 const r = await fetch(new URL(path, origin), {headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(30000)});
 const html = await r.text();
 return {path,status:r.status,url:r.url,html,contentType:r.headers.get('content-type'),xRobots:r.headers.get('x-robots-tag')};
}
(async()=>{
 const sitemap=await get('/sitemap.xml');
 if(sitemap.status!==200 || !sitemap.html.includes('<urlset')) throw Error('Sitemap is not successful XML.');
 const urls=[...sitemap.html.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]).sort();
 const robots=await get('/robots.txt');
 const routes=[]; const assets=new Set();
 for(const path of ['/', '/login','/dashboard','/workspace/connections','/workspace/scheduling/public','/workspace/invoices/test-billing','/articles']){
  const r=await get(path);
  routes.push({path,status:r.status,title:r.html.match(/<title>(.*?)<\/title>/)?.[1],canonical:r.html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/)?.[1],robots:r.html.match(/<meta[^>]+name="robots"[^>]+content="([^"]+)"/)?.[1],xRobots:r.xRobots,sha256:crypto.createHash('sha256').update(r.html).digest('hex')});
  for(const m of r.html.matchAll(/<script[^>]*src="([^"]+)"/g)) assets.add(m[1]);
 }
 const matches=[],refs=new Set(),deployments=new Set();
 for(const src of assets){
  const r=await get(src); const markers=['Public booking link','TEST MODE ONLY','scheduled every five minutes'].filter(x=>r.html.includes(x));
  if(markers.length)matches.push({url:new URL(src,origin).href,markers});
  for(const m of r.html.matchAll(/https:\/\/([a-z]{20})\.supabase\.co/g))refs.add(m[1]);
  const id=new URL(src,origin).searchParams.get('dpl');if(id)deployments.add(id);
 }
 const sha=process.argv[3]||'74b15186f73a80ef6953e374786ce6fef4966ea5';
 const status=await fetch('https://api.github.com/repos/joshuaclark5/MicroFreelanceHub/commits/'+sha+'/status',{signal:AbortSignal.timeout(30000)});
 const j=await status.json();
 const result={at:new Date().toISOString(),origin,sha,github:{status:status.status,state:j.state,checks:j.statuses?.map(s=>({context:s.context,state:s.state,url:s.target_url}))},routes,urls,robots:robots.html,matches,supabaseRefs:[...refs],deployments:[...deployments]};
 fs.writeFileSync(out,JSON.stringify(result,null,2));
 console.log(JSON.stringify({routes:routes.map(r=>({path:r.path,status:r.status})),sitemapUrls:urls.length,deployments:[...deployments],supabaseRefs:[...refs],markers:matches.flatMap(r=>r.markers),github:result.github}));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
