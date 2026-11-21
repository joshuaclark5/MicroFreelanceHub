const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/joshu/AppData/Roaming/npm/node_modules/openclaw/node_modules/playwright-core');
const origin = process.env.QA_BASE_URL || 'http://127.0.0.1:3047';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    for (const timezoneId of ['UTC', 'America/New_York', 'Asia/Tokyo']) {
      const context = await browser.newContext({ timezoneId, viewport: { width: 390, height: 844 } });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route(/google-analytics\.com|googletagmanager\.com/, route => route.abort());
      const response = await page.goto(origin + '/workspace/time');
      assert.equal(response.status(), 200);
      await page.waitForFunction(tz => document.body.innerText.includes('Your timezone: ' + tz), timezoneId);
      await page.waitForFunction(() => document.querySelector('input[type="datetime-local"]')?.value && document.querySelector('input[type="date"]')?.value);
      assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'), 'noindex, nofollow');
      assert.deepEqual(errors, [], `Unexpected browser errors in ${timezoneId}`);
      console.log(`PASS production SSR hydration and initialized date fields: ${timezoneId}`);
      await context.close();
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
