const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('C:/Users/joshu/AppData/Roaming/npm/node_modules/openclaw/node_modules/playwright-core');
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:3057';
const out = process.env.QA_OUT || 'artifacts/template-discovery';
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const results = [];
  try {
    for (const width of [320, 390, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 950 } });
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      let failure = false;
      await page.route('**/*', async route => {
        const r = route.request(), u = new URL(r.url());
        if (!['GET','HEAD'].includes(r.method())) return route.abort();
        if (u.pathname === '/api/templates' && failure) return route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
        return route.continue();
      });
      await Promise.all([page.waitForResponse(r => new URL(r.url()).pathname === '/api/templates' && r.status() === 200), page.goto(base + '/templates')]);
      await page.locator('.public-library').getByRole('status').filter({ hasText: /^\d+ templates$/ }).waitFor();
      const baselineCount = await page.locator('.public-library').getByRole('status').innerText();
      const baselineLinks = await page.locator('.public-library a.group').evaluateAll(es => es.map(e => new URL(e.href).pathname));
      assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'), 'https://www.microfreelancehub.com/templates');
      await page.getByRole('button', { name: 'Emails', exact: true }).click();
      await page.locator('.public-library').getByRole('status').filter({ hasText: /^\d+ templates$/ }).waitFor();
      assert.equal(await page.getByRole('button', { name: 'Emails', exact: true }).getAttribute('aria-pressed'), 'true');
      const emailTitles = await page.locator('.public-library a.group h2').allTextContents();
      assert.ok(emailTitles.length > 0);
      assert.ok(emailTitles.every(t => /email/i.test(t)), JSON.stringify(emailTitles));
      await page.getByRole('textbox', { name: 'Search templates' }).fill('zzzznonexistentqualityaudit');
      await page.getByText('No templates found', { exact: true }).waitFor();
      await page.screenshot({ path: `${out}/empty-${width}.png`, fullPage: true });
      await page.getByRole('button', { name: 'Clear search and filters' }).click();
      await page.locator('.public-library').getByRole('status').filter({ hasText: baselineCount }).waitFor();
      assert.equal(await page.getByRole('textbox', { name: 'Search templates' }).inputValue(), '');
      assert.equal(await page.getByRole('button', { name: 'All', exact: true }).getAttribute('aria-pressed'), 'true');
      assert.deepEqual(await page.locator('.public-library a.group').evaluateAll(es => es.map(e => new URL(e.href).pathname)), baselineLinks);
      await page.screenshot({ path: `${out}/restored-${width}.png`, fullPage: false });
      failure = true;
      await page.getByRole('button', { name: 'Emails', exact: true }).click();
      await page.locator('.public-library').getByRole('status').filter({ hasText: 'Templates unavailable' }).waitFor();
      assert.equal(await page.locator('.public-library').getByRole('status').innerText(), 'Templates unavailable');
      assert.ok(await page.getByRole('button', { name: 'Next', exact: true }).isDisabled());
      failure = false;
      await page.getByRole('button', { name: 'Retry', exact: true }).click();
      await page.locator('.public-library').getByRole('status').filter({ hasText: /^\d+ templates$/ }).waitFor();
      assert.ok((await page.locator('.public-library a.group h2').allTextContents()).every(t => /email/i.test(t)));
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      assert.deepEqual(errors, []);
      results.push({ width, baselineCount, emailResults: emailTitles.length, reset: true, retry: true, overflow: false });
      await page.close();
    }
  } finally { await browser.close(); }
  fs.writeFileSync(`${out}/results.json`, JSON.stringify({ base, results }, null, 2));
  console.log(JSON.stringify(results));
})().catch(e => { console.error(e); process.exitCode = 1; });
