const fs=require('node:fs'),crypto=require('node:crypto');
const [baselineFile,out]=process.argv.slice(2);if(!baselineFile||!out)throw Error('Baseline and output paths required');
const baseline=JSON.parse(fs.readFileSync(baselineFile));
const queue=[...baseline.urls],rows=[];
async function worker(){while(queue.length){const url=queue.shift();try{
 if(new URL(url).origin!==baseline.origin)throw Error('Unexpected sitemap origin');
 const r=await fetch(url,{signal:AbortSignal.timeout(30000)}),html=await r.text();
 const title=html.match(/<title>(.*?)<\/title>/)?.[1]||null,description=html.match(/<meta[^>]+name="description"[^>]+content="([^"]*)"/)?.[1]||null;
 const canonical=html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/)?.[1]||null;
 const robots=html.match(/<meta[^>]+name="robots"[^>]+content="([^"]+)"/)?.[1]||'',xRobots=r.headers.get('x-robots-tag')||'';
 const content=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
 const links=[...new Set([...html.matchAll(/href="(\/(?!\/)[^"#?]*)/g)].map(m=>m[1]))];
 rows.push({url,status:r.status,finalUrl:r.url,title,description,canonical,robots,xRobots,contentLength:content.length,contentHash:crypto.createHash('sha256').update(content).digest('hex'),links,indexable:r.status===200&&!/noindex/i.test(robots+' '+xRobots)});
 }catch(e){rows.push({url,error:e.message});}
 if(rows.length%100===0){fs.writeFileSync(out,JSON.stringify({complete:false,checked:rows.length,total:baseline.urls.length,rows},null,2));console.log(rows.length+'/'+baseline.urls.length);}
}}
(async()=>{await Promise.all(Array.from({length:6},worker));rows.sort((a,b)=>a.url.localeCompare(b.url));const result={at:new Date().toISOString(),complete:true,checked:rows.length,total:baseline.urls.length,errors:rows.filter(r=>r.error||r.status!==200||!r.indexable||!r.title||!r.description||!r.canonical).map(r=>({url:r.url,status:r.status,error:r.error,indexable:r.indexable,missingTitle:!r.title,missingDescription:!r.description,missingCanonical:!r.canonical})),rows};fs.writeFileSync(out,JSON.stringify(result,null,2));console.log(JSON.stringify({checked:result.checked,issues:result.errors.length}));})();
