const assert = require('node:assert/strict');
const fs = require('node:fs');
const out = process.env.QA_OUT || 'artifacts/client-payment-view';
fs.mkdirSync(out, { recursive: true });
const results = [];
require('dotenv').config({ path: '.env.local', quiet: true });
const { chromium } = require('C:/Users/joshu/AppData/Roaming/npm/node_modules/openclaw/node_modules/playwright-core');
const base = process.env.QA_BASE_URL || 'http://localhost:3036';
const host = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname;
const id = '00000000-0000-4000-8000-000000000099';
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    for (const width of [1440, 390, 320]) {
      const context = await browser.newContext({ viewport: { width, height: 950 } });
      const blockedWrites = [];
      await context.route('**/*', route => {
        const request = route.request(), url = new URL(request.url());
        if (!['GET', 'HEAD'].includes(request.method())) { blockedWrites.push(url.pathname); return route.abort(); }
        if (url.origin !== new URL(base).origin || url.pathname.startsWith('/api/')) return route.abort();
        return route.continue();
      });
      let verified = false;
      let agreementOnly = false;
      let unavailable = false;
      await context.route(`https://${host}/**`, route => {
        if (route.request().method() !== 'GET') return route.abort();
        const path = new URL(route.request().url()).pathname;
        if (unavailable && path.includes('sow_documents')) return route.fulfill({status:404,json:{message:'Fictional unavailable document'}});
        const body = path.includes('sow_documents') ? {
          id, user_id: 'owner', title: 'Website agreement', client_name: 'Example client',
          created_at: '2026-09-29T12:00:00Z',
          price: agreementOnly ? 0 : 1000, status: agreementOnly ? 'Pending' : 'Signed', signed_by: agreementOnly ? null : 'Client', provider_sign: agreementOnly ? null : 'Owner',
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
      await page.screenshot({ path: `${out}/payment-${width}.png`, fullPage: true });
      agreementOnly = true;
      await page.goto(`${base}/sow/${id}`);
      const portal = page.getByTestId('client-portal');
      await portal.getByText('No payment or client account needed.', { exact: false }).waitFor();
      assert.equal(await portal.evaluate(el => getComputedStyle(el).backgroundColor), 'rgba(0, 0, 0, 0)');
      const review = portal.getByRole('button', { name: 'Review and sign agreement' });
      assert.equal(await review.evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(25, 77, 65)');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: `${out}/portal-${width}.png`, fullPage: true });
      await review.click();
      await page.getByRole('heading', { name: 'Sign Contract', exact: true }).waitFor();
      assert.equal(await page.getByRole('button', { name: 'Provider', exact: true }).count(), 0);
      await page.getByRole('button', { name: 'Cancel', exact: true }).click();
      assert.equal(await review.evaluate(el => el === document.activeElement), true);
      await page.getByRole('button', { name: 'Agreement actions', exact: true }).click();
      assert.equal(await page.getByRole('link', { name: 'Edit Contract', exact: true }).count(), 0);
      unavailable = true;
      await page.reload();
      await page.getByRole('heading', { name: 'Agreement unavailable', exact: true }).waitFor();
      await page.screenshot({path:`${out}/unavailable-${width}.png`});
      unavailable = false;
      await page.getByRole('button', {name:'Retry',exact:true}).click();
      await page.getByTestId('client-portal').waitFor();
      assert.deepEqual(errors, []);
      assert.deepEqual(blockedWrites, []);
      results.push({width,base,passed:true,fictionalData:true,unexpectedWrites:blockedWrites.length});
      await context.close();
    }
    console.log('PASS: payment verification states, document-first portal/brand action, agreement-only copy, signing dialog/focus recovery, unavailable retry and desktop/mobile layouts; all payment and database requests mocked.');
  } finally { fs.writeFileSync(out+'/results.json', JSON.stringify(results,null,2)); await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
