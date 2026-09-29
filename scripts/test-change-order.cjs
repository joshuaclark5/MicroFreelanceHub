const assert = require('node:assert/strict');
require('dotenv').config({ path: '.env.local', quiet: true });
const { chromium } = require('C:/Users/joshu/AppData/Roaming/npm/node_modules/openclaw/node_modules/playwright-core');
const base = process.env.QA_BASE_URL || 'http://localhost:3036';
const host = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname;
const user = { id: '00000000-0000-4000-8000-000000000001', email: 'fixture@example.test', aud: 'authenticated', role: 'authenticated' };
const doc = { id: '00000000-0000-4000-8000-000000000099', user_id: user.id, title: 'Website agreement', client_name: 'Example', client_data: { email: 'client@example.test' }, status: 'Signed', signed_by: 'Client', provider_sign: 'Owner', price: 1000, payment_received_cents: 50000, deliverables: 'Original scope', line_items: [{ id: 'base', description: 'Project', quantity: 1, amount: 1000 }], payment_type: 'one_time' };
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    for (const width of [1440, 390]) {
      const context = await browser.newContext({ viewport: { width, height: 950 } });
      await context.addCookies([{ name: `sb-${host.split('.')[0]}-auth-token`, value: encodeURIComponent(JSON.stringify({ access_token: 'fixture-token', refresh_token: 'fixture-refresh', expires_at: Math.floor(Date.now()/1000)+3600, token_type: 'bearer', user })), url: base }]);
      await context.route(/google-analytics\.com|googletagmanager\.com/, route => route.abort());
      const updates = [];
      await context.route(`https://${host}/**`, route => {
        const request = route.request(), url = new URL(request.url());
        if (request.method() === 'PATCH' && url.pathname.includes('sow_documents')) {
          updates.push(request.postDataJSON());
          return route.fulfill({ status: 204 });
        }
        if (request.method() !== 'GET') return route.abort();
        const body = url.pathname.includes('/auth/') ? user : url.pathname.includes('profiles') ? { is_pro: true, has_completed_onboarding: true } : url.pathname.includes('sow_documents') ? (url.searchParams.has('id') ? doc : [doc]) : [];
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
      });
      const page = await context.newPage();
      await page.goto(`${base}/edit/${doc.id}`);
      await page.getByPlaceholder('Untitled Agreement').fill('Website change order');
      await page.getByPlaceholder('Start typing your agreement here...').fill('Original scope plus one additional logo variant.');
      await page.getByRole('button', { name: 'Monthly', exact: true }).waitFor();
      await page.getByRole('button', { name: 'Update Contract', exact: true }).click();
      assert.equal(updates.length, 0, 'Signed agreements require explicit reset confirmation');
      await page.getByRole('button', { name: /Reset Signatures & Update/ }).click();
      await page.waitForURL('**/dashboard');
      assert.equal(updates.length, 1);
      assert.equal(updates[0].status, 'Draft');
      assert.equal(updates[0].signed_by, null);
      assert.equal(updates[0].provider_sign, null);
      assert.ok(!('payment_received_cents' in updates[0]));
      assert.match(updates[0].deliverables, /additional logo variant/);
      await context.close();
    }
    console.log('PASS: desktop/mobile change-order confirmation resets signatures without overwriting received-payment balance; all writes mocked.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
