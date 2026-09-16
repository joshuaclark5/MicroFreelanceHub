const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/lib/articleDate.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: exportsObject, Intl, Date });
assert.equal(exportsObject.formatArticleDate('2026-09-15'), 'September 15, 2026');
assert.equal(exportsObject.formatArticleDate('2026-09-15', 'short'), 'Sep 15, 2026');
const { chromium } = require('C:/Users/joshu/AppData/Roaming/npm/node_modules/openclaw/node_modules/playwright-core');
const base = process.env.QA_BASE_URL || 'http://localhost:3025';
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage();
    const first = await (await page.request.get(`${base}/api/templates`)).json();
    const second = await (await page.request.get(`${base}/api/templates?page=2`)).json();
    assert.ok(first.total > 600);
    assert.equal(first.templates.length, 48);
    assert.ok(!second.templates.some(item => first.templates.some(other => other.slug === item.slug)));
    const slug = 'polite-overdue-invoice-reminder-email-template';
    const found = await (await page.request.get(`${base}/api/templates?q=${slug}`)).json();
    assert.ok(found.templates.some(item => item.slug === slug));
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${base}/templates`);
      await page.getByRole('textbox', { name: 'Search templates' }).fill(slug);
      await page.locator(`a[href="/templates/${slug}"]`).waitFor();
      await page.goto(`${base}/templates/project-handoff-checklist-for-logo-designers`);
      await page.getByRole('button', { name: 'Read the Checklist', exact: true }).first().waitFor();
      const checklist = await page.locator('body').innerText();
      assert.ok(!/statement of work|generate contract|collect deposit/i.test(checklist));
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: `qa-checklist-${width}.png` });
      await page.goto(`${base}/templates/late-payment-reminder-email-after-no-response`);
      const email = await page.locator('body').innerText();
      assert.ok(!/template template|statement of work|generate contract/i.test(email));
      await page.goto(`${base}/create`);
      const editor = page.getByPlaceholder('Start typing your agreement here...');
      await editor.waitFor();
      await editor.fill('Regression check\nPreserve this exact text.');
      await page.getByRole('button', { name: 'Clear', exact: true }).click();
      await page.getByRole('button', { name: 'Are you sure?', exact: true }).click();
      assert.equal(await editor.inputValue(), '');
      await page.getByRole('button', { name: 'Undo', exact: true }).click();
      assert.equal(await editor.inputValue(), 'Regression check\nPreserve this exact text.');
    }
    await page.goto(`${base}/tools/client-message-generator`);
    assert.ok(!/SEO wedge|Each client situation can become a search page/.test(await page.locator('body').innerText()));
    await page.goto(`${base}/articles/client-asks-for-revisions-after-final-files-delivered-reply-template`);
    assert.ok(/September 15, 2026/i.test(await page.locator('body').innerText()));
    assert.equal((await page.request.get(`${base}/api/stripe/subscription`)).status(), 401);
    assert.equal((await page.request.post(`${base}/api/stripe/create-portal`, { data: { userId: 'untrusted' } })).status(), 401);
    console.log('PASS: full-library search, pagination, checklist/email classification, Clear/Undo desktop/mobile, dates, public copy, billing authorization');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
