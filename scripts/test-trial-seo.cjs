const assert = require('node:assert/strict');
const fs = require('node:fs');
const file = process.env.QA_SEO_RECEIPT;
if (!file) throw Error('Private receipt path required');
async function snapshot(base) {
  const result = {};
  for (const path of ['/pricing', '/robots.txt', '/sitemap.xml']) {
    const response = await fetch(base + path); assert.equal(response.status, 200, path);
    const body = await response.text();
    if (path === '/pricing') result.pricing = {
      title: body.match(/<title>(.*?)<\/title>/)?.[1],
      canonical: body.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1],
      robots: body.match(/<meta[^>]*name="robots"[^>]*content="([^"]+)"/)?.[1],
      headerRobots: response.headers.get('x-robots-tag'),
    };
    else if (path === '/sitemap.xml') {
      assert.ok(body.includes('<urlset'), 'Must be an XML sitemap');
      result.urls = [...body.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]).sort();
    } else result.robots = body;
  }
  return result;
}
(async () => {
  const live = await snapshot('https://microfreelancehub.com');
  const local = await snapshot(process.env.QA_BASE_URL || 'http://127.0.0.1:3085');
  assert.deepEqual(local.pricing, live.pricing); assert.equal(local.robots, live.robots);
  const missing = live.urls.filter(url => !local.urls.includes(url)); assert.deepEqual(missing, []);
  fs.writeFileSync(file, JSON.stringify({ at: new Date().toISOString(), liveCount: live.urls.length, localCount: local.urls.length, pricing: local.pricing, missing }, null, 2));
  console.log(`PASS pricing metadata/robots and all ${live.urls.length} live sitemap URLs preserved.`);
})().catch(e => { console.error(e); process.exitCode = 1; });
