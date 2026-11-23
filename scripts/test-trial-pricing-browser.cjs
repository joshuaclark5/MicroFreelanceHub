const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('C:/Users/joshu/AppData/Roaming/npm/node_modules/openclaw/node_modules/playwright-core');
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:3085';
const out = process.env.QA_OUT;
if (!out) throw Error('Private QA_OUT required');
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    for (const width of [320, 390, 1440]) for (const trialDays of [0, 7]) {
      const context = await browser.newContext({ viewport: { width, height: 1000 } });
      const page = await context.newPage(); const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await context.route('**/*', route => {
        const u = new URL(route.request().url());
        if (u.origin !== base) return route.abort();
        if (u.pathname === '/api/stripe/checkout-plan') return route.fulfill({ json: { trialDays } });
        return route.continue();
      });
      await page.goto(base + '/pricing');
      const button = page.getByRole('button', { name: trialDays ? 'Try Starter for 7 days' : 'Choose Starter — $9/month' });
      await button.waitFor();
      assert.equal(await page.getByText('Automated dunning emails').count(), 0);
      if (trialDays) await page.getByText(/Card required/).waitFor();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'No horizontal overflow');
      await page.screenshot({ path: `${out}/pricing-${width}-trial${trialDays}.png`, fullPage: true });
      await button.click(); await page.waitForURL('**/login?**');
      assert.equal(new URL(page.url()).searchParams.get('plan'), 'starter');
      assert.deepEqual(errors, []);
      await context.close();
    }
    console.log('PASS pricing mobile/desktop, trial ON/OFF disclosure, no overflow, signup plan handoff. Mocked policy; no provider writes.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
