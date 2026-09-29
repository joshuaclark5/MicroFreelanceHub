const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/joshu/AppData/Roaming/npm/node_modules/openclaw/node_modules/playwright-core');
const base = process.env.QA_BASE_URL || 'http://localhost:3037';
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(60000);
    await page.route(/google-analytics\.com|googletagmanager\.com/, r => r.abort());
    for (const [path, canonical] of [['/?ref=producthunt', 'https://www.microfreelancehub.com'], ['/create?template=interior-plant-stylist', 'https://www.microfreelancehub.com/create']]) {
      await page.goto(base + path);
      assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), canonical);
    }
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 950 });
      for (const slug of ['mobile-mechanic-contract-template', 'gutter-installer-contract-template', 'parking-lot-striper-contract-template']) {
        const response = await page.goto(`${base}/templates/${slug}`);
        assert.equal(response.status(), 200);
        await page.getByRole('heading', { name: 'From job details to an approved scope', exact: true }).waitFor();
        assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), `https://www.microfreelancehub.com/templates/${slug}`);
        const action = page.getByRole('link', { name: /^Start my / });
        assert.equal(await action.getAttribute('href'), `/create?template=${slug}&source=trade-workflow`);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${slug} at ${width}px`);
        if (slug === 'mobile-mechanic-contract-template') await page.screenshot({ path: `trade-entry-${width}.png`, fullPage: true });
      }
      await page.getByRole('button', { name: 'Send feedback', exact: true }).click();
      await page.getByRole('textbox', { name: 'Feedback message', exact: true }).waitFor();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.getByRole('button', { name: 'Close feedback', exact: true }).first().click();
    }
    for (const slug of ['unpaid-extra-work-response-template-for-freelancers', 'interior-plant-stylist', 'operations-automation-consultant-change-request-payment-agreement']) {
      await page.goto(`${base}/profession/${slug}`);
      await page.waitForURL(`${base}/templates/${slug}`);
      assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), `https://www.microfreelancehub.com/templates/${slug}`);
    }
    const missing = await page.request.get(`${base}/profession/nonexistent-fixture-profession-92833`);
    assert.equal(missing.status(), 404, 'Unrelated missing routes must not be redirected');
    console.log('PASS: home/editor canonical queries, three existing trade entries at desktop/mobile, exact document redirects, unrelated 404 retained.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
