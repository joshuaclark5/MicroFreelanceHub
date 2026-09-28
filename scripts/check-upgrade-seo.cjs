const { parseStringPromise } = require('xml2js');
const fs = require('node:fs');
const { chromium } = require('C:/Users/joshu/AppData/Roaming/npm/node_modules/openclaw/node_modules/playwright-core');
const base = process.env.QA_BASE_URL || 'http://localhost:3036';
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage();
    async function urls(origin) {
      const response = await page.request.get(`${origin}/sitemap.xml`, { timeout: 90000 });
      if (response.status() !== 200) throw new Error(`Sitemap returned ${response.status()}`);
      const parsed = await parseStringPromise(await response.text());
      if (!parsed.urlset?.url) throw new Error('Expected URL sitemap');
      return parsed.urlset.url.map(entry => new URL(entry.loc[0]).pathname).sort();
    }
    const live = await urls('https://www.microfreelancehub.com');
    const preview = await urls(base);
    const missing = live.filter(url => !preview.includes(url));
    const report = { capturedAt: new Date().toISOString(), liveCount: live.length, previewCount: preview.length, missing, added: preview.filter(url => !live.includes(url)), note: 'Sitemap coverage is not Google indexing evidence. Preview is based on commit 235644b; later published articles need integration before release.' };
    fs.writeFileSync('upgrade-seo-baseline.json', JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
    if (missing.some(url => !url.startsWith('/articles/'))) process.exitCode = 1;
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
