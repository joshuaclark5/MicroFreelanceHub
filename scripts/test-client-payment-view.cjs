const assert = require('node:assert/strict');
require('dotenv').config({ path: '.env.local', quiet: true });
const { chromium } = require('C:/Users/joshu/AppData/Roaming/npm/node_modules/openclaw/node_modules/playwright-core');
const base = process.env.QA_BASE_URL || 'http://localhost:3036';
const host = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname;
const id = '00000000-0000-4000-8000-000000000099';
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    for (const width of [1440, 390]) {
      const context = await browser.newContext({ viewport: { width, height: 950 } });
      await context.route(/google-analytics\.com|googletagmanager\.com/, route => route.abort());
      let verified = false;
      await context.route(`https://${host}/**`, route => {
        if (route.request().method() !== 'GET') return route.abort();
        const path = new URL(route.request().url()).pathname;
        const body = path.includes('sow_documents') ? {
          id, user_id: 'owner', title: 'Website agreement', client_name: 'Example client',
          price: 1000, status: 'Signed', signed_by: 'Client', provider_sign: 'Owner',
          deliverables: 'Five pages and two revision rounds.', payment_type: 'one_time',
          payment_received_cents: verified ? 50000 : 0,
          payment_schedule_structured: { type: '50', depositAmount: 500 },
        } : path.includes('/auth/') ? { user: null } : {};
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
      });
      await context.route(`${base}/api/sow/mark-paid`, route => {
        verified = route.request().postDataJSON().sessionId === 'cs_verified_fixture';
        return route.fulfill({ status: verified ? 200 : 409, contentType: 'application/json', body: JSON.stringify({ success: verified }) });
      });
      const page = await context.newPage();
      page.setDefaultTimeout(120000);
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${base}/sow/${id}?payment=success`);
      await page.getByRole('status').filter({ hasText: 'confirmation is pending' }).waitFor();
      assert.equal(await page.getByRole('button', { name: 'Paid in Full', exact: true }).count(), 0);
      await page.goto(`${base}/sow/${id}?payment=success&session_id=cs_verified_fixture`);
      await page.getByRole('status').filter({ hasText: 'Payment received' }).waitFor();
      assert.equal(await page.getByRole('button', { name: 'Paid in Full', exact: true }).count(), 0);
      assert.ok(await page.getByRole('button', { name: /Pay Remaining Balance/ }).count());
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: `upgrade-client-payment-${width}.png` });
      assert.deepEqual(errors, []);
      await context.close();
    }
    console.log('PASS: forged success query stays unpaid, verified deposit shows remaining balance, desktop/mobile layout; all payment and database requests mocked.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
