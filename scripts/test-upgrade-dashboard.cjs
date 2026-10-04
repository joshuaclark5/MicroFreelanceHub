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
    await context.route(/google-analytics\.com|googletagmanager\.com/, route => route.abort());
    const recovered = [];
    await context.addCookies([{ name: `sb-${host.split('.')[0]}-auth-token`, value: encodeURIComponent(JSON.stringify({ access_token: 'fixture-token', refresh_token: 'fixture-refresh', expires_at: Math.floor(Date.now()/1000)+3600, token_type: 'bearer', user })), url: base }]);
    await context.route(`https://${host}/**`, route => {
      const path = new URL(route.request().url()).pathname;
      if (route.request().method() === 'POST' && path.includes('/sow_documents')) {
        recovered.push(route.request().postDataJSON());
        return route.fulfill({ status: 201, contentType: 'application/json', body: '[]' });
      }
      if (route.request().method() !== 'GET') return route.abort();
      const body = path.includes('/auth/v1/user') ? user : path.includes('/profiles') ? { is_pro: true, has_completed_onboarding: true, stripe_account_id: null } : path.includes('/sow_documents') ? docs : [];
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
    });
    const page = await context.newPage();
    page.setDefaultTimeout(120000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 950 });
      await page.goto(`${base}/dashboard`);
      await page.getByRole('heading', { name: 'Your agreements', exact: true }).waitFor();
      const draft = page.getByRole('button', { name: 'Draft agreements 1', exact: true });
      await draft.click();
      assert.equal(await draft.getAttribute('aria-pressed'), 'true');
      await page.getByRole('heading', { name: 'Website agreement', exact: true, level: 3 }).waitFor();
      assert.equal(await page.getByRole('heading', { name: 'Brand agreement', exact: true, level: 3 }).count(), 0);
      assert.equal(await page.locator('details').first().getAttribute('open'), null);
      assert.equal(await page.getByRole('link', { name: 'Open Website agreement', exact: true }).getAttribute('href'), '/sow/draft-fixture');
      await page.locator('.d4-agreement-row').first().locator('summary').click();
      await page.getByRole('link', { name: 'Edit draft', exact: true }).waitFor();
      await page.getByRole('button', { name: 'Copy link', exact: true }).waitFor();
      const box = await page.getByRole('button', { name: 'Actions for Website agreement', exact: true }).boundingBox();
      assert.ok(box.width >= 44 && box.height >= 44, 'Actions must have a visible touch target');
      await page.getByRole('button', { name: 'Actions for Website agreement', exact: true }).click();
      assert.equal(await page.getByRole('button', { name: 'Mark Paid', exact: true }).count(), 0);
      await draft.click();
      await page.getByRole('link', { name: 'Open Website agreement', exact: true }).focus();
      assert.equal(await page.getByRole('link', { name: 'Open Website agreement', exact: true }).evaluate(el => el === document.activeElement), true);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: `upgrade-dashboard-${width}.png` });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow at ${width}px`);
    }
    const pending = {
      version: 2, id: '00000000-0000-4000-8000-000000000099', saved_at: Date.now(),
      title: 'Recovery fixture', client_name: 'Example client', client_data: { email: 'client@example.test' },
      price: 1139, tax_rate: '10', line_items: [{ id: 'base', description: 'Project', quantity: 1, amount: 1000 }, { id: 'fee-auto', description: 'Fee', quantity: 1, amount: 39 }],
      deliverables: 'Fixture scope', payment_type: 'one_time', due_date: '2026-12-01', dunning_enabled: false,
      payment_schedule_structured: { type: 'split', depositAmount: 569.5, remainingAmount: 569.5, paymentTerms: 'net30', splitCount: '2', splitFrequency: '30' },
    };
    await page.evaluate(value => localStorage.setItem('pendingSOW', JSON.stringify(value)), pending);
    await page.reload();
    await page.waitForFunction(() => localStorage.getItem('pendingSOW') === null);
    assert.equal(recovered.length, 1);
    const record = Array.isArray(recovered[0]) ? recovered[0][0] : recovered[0];
    assert.equal(record.id, pending.id);
    assert.equal(record.price, 1139, 'Recovery must not apply tax to the processing fee');
    assert.equal(record.client_data.email, pending.client_data.email);
    assert.equal(record.due_date, pending.due_date);
    assert.equal(record.dunning_enabled, false);
    assert.deepEqual(record.payment_schedule_structured, pending.payment_schedule_structured);
    await page.setViewportSize({width:1440,height:950});
    await page.goto(`${base}/dashboard`);
    await page.getByRole('heading',{name:'Your agreements',exact:true}).waitFor();
    await page.locator('.d4-agreement-row').filter({hasText:'Brand agreement'}).getByRole('button',{name:'View details',exact:true}).click();
    await page.getByRole('complementary',{name:'Selected agreement details'}).getByRole('heading',{name:'Brand agreement',exact:true}).waitFor();
    assert.equal(await page.locator('.d4-agreement-row').first().evaluate(e=>getComputedStyle(e).display),'grid');
    docs.length=0;
    await page.reload();
    await page.getByRole('heading',{name:'Your first agreement starts here.',exact:true}).waitFor();
    assert.equal(await page.getByRole('complementary',{name:'Selected agreement details'}).count(),0);
    await page.screenshot({path:'d4-dashboard-empty.png'});
    assert.deepEqual(errors, []);
    console.log('PASS: dashboard layout and pending draft recovery preserve total, email, due date and split terms; all Supabase writes mocked');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
