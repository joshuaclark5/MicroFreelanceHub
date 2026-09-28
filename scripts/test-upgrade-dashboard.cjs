const assert = require('node:assert/strict');
require('dotenv').config({ path: '.env.local', quiet: true });
const { chromium } = require('C:/Users/joshu/AppData/Roaming/npm/node_modules/openclaw/node_modules/playwright-core');
const base = process.env.QA_BASE_URL || 'http://localhost:3036';
const host = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname;
const user = { id: '00000000-0000-4000-8000-000000000001', email: 'fixture@example.test', aud: 'authenticated', role: 'authenticated' };
const docs = [
  { id: 'draft-fixture', title: 'Website agreement', client_name: 'Example client', status: 'Draft', price: 1000, payment_type: 'one_time', created_at: '2026-09-01T00:00:00Z' },
  { id: 'paid-fixture', title: 'Brand agreement', client_name: 'Example studio', status: 'Paid', price: 500, payment_type: 'one_time', created_at: '2026-09-01T00:00:00Z' },
];
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const context = await browser.newContext();
    await context.addCookies([{ name: `sb-${host.split('.')[0]}-auth-token`, value: encodeURIComponent(JSON.stringify({ access_token: 'fixture-token', refresh_token: 'fixture-refresh', expires_at: Math.floor(Date.now()/1000)+3600, token_type: 'bearer', user })), url: base }]);
    await context.route(`https://${host}/**`, route => {
      if (route.request().method() !== 'GET') return route.abort();
      const path = new URL(route.request().url()).pathname;
      const body = path.includes('/auth/v1/user') ? user : path.includes('/profiles') ? { is_pro: true, has_completed_onboarding: true, stripe_account_id: null } : path.includes('/sow_documents') ? docs : [];
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 950 });
      await page.goto(`${base}/dashboard`);
      await page.getByRole('heading', { name: 'Your agreements', exact: true }).waitFor();
      const draft = page.getByRole('button', { name: 'Draft agreements 1', exact: true });
      await draft.click();
      assert.equal(await draft.getAttribute('aria-pressed'), 'true');
      await page.getByRole('heading', { name: 'Website agreement', exact: true }).waitFor();
      assert.equal(await page.getByRole('heading', { name: 'Brand agreement', exact: true }).count(), 0);
      assert.equal(await page.locator('details').getAttribute('open'), null);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: `upgrade-dashboard-${width}.png` });
    }
    assert.deepEqual(errors, []);
    console.log('PASS: dashboard fixture rendering, filters, collapsed finances and mobile layout; all Supabase calls mocked, no live data written');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
