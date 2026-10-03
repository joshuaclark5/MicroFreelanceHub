const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/joshu/AppData/Roaming/npm/node_modules/openclaw/node_modules/playwright-core');
const base = process.env.QA_BASE_URL || 'http://localhost:3036';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    for (const width of [1440, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 950 } });
      page.setDefaultTimeout(120000);
      await page.route(/google-analytics\.com|googletagmanager\.com/, route => route.abort());
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(base, { waitUntil: 'domcontentloaded' });
      await page.getByRole('link', { name: 'Start my agreement' }).first().waitFor();
      await page.screenshot({ path: `upgrade-home-${width}.png` });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.getByRole('link', { name: 'Start my agreement' }).first().click();
      await page.getByLabel('Project name').fill('Website redesign');
      await page.getByLabel('Project price').fill('1000');
      await page.getByRole('button', { name: 'Continue', exact: true }).click();
      await page.getByLabel('Deliverables and included revisions').fill('Five pages and two revision rounds.');
      await page.getByLabel('Timeline and milestones').fill('First draft in two weeks.');
      await page.reload();
      await page.getByLabel('Deliverables and included revisions').waitFor();
      assert.equal(await page.getByLabel('Deliverables and included revisions').inputValue(), 'Five pages and two revision rounds.');
      assert.equal(await page.getByLabel('Timeline and milestones').inputValue(), 'First draft in two weeks.');
      await page.getByRole('button', { name: 'Continue', exact: true }).click();
      assert.ok((await page.locator('body').innerText()).includes('$1,000.00'));
      await page.screenshot({ path: `upgrade-review-${width}.png` });
      await page.getByRole('button', { name: 'Review agreement', exact: true }).click();
      const editor = page.getByPlaceholder('Start typing your agreement here...');
      await editor.waitFor();
      await page.waitForFunction(() => document.querySelector('textarea')?.value.includes('1039.00'));
      assert.match(await editor.inputValue(), /Five pages and two revision rounds/);
      assert.match(await editor.inputValue(), /First draft in two weeks/);
      await page.getByRole('button', { name: 'Monthly', exact: true }).waitFor();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await editor.fill('Preserve this exact text.');
      await page.getByRole('button', { name: 'Clear', exact: true }).click();
      await page.getByRole('button', { name: 'Are you sure?', exact: true }).click();
      await page.getByRole('button', { name: 'Undo', exact: true }).click();
      assert.equal(await editor.inputValue(), 'Preserve this exact text.');
      await page.waitForFunction(() => JSON.parse(sessionStorage.getItem('mfh-editor-draft-v1') || 'null')?.draft.formData.deliverables === 'Preserve this exact text.');
      await page.reload();
      await editor.waitFor();
      assert.equal(await editor.inputValue(), 'Preserve this exact text.');
      await page.goto(`${base}/create?mode=editor`);
      await editor.waitFor();
      assert.equal(await page.getByLabel('Project name').count(), 0);
      await page.getByPlaceholder('e.g. John Smith').fill('QA Client');
      await page.getByPlaceholder('e.g. john@example.com').fill('qa@example.test');
      await page.getByRole('button', { name: 'Create Client Link', exact: true }).click();
      const dialog = page.getByRole('dialog', { name: 'Save your agreement' });
      await dialog.waitFor();
      for (let tab = 0; tab < 8; tab++) {
        await page.keyboard.press('Tab');
        assert.ok(await dialog.evaluate(el => el.contains(document.activeElement)), 'Signup dialog contains keyboard focus');
      }
      await page.keyboard.press('Escape');
      await dialog.waitFor({ state: 'hidden' });
      assert.equal(await editor.inputValue(), 'Preserve this exact text.');
      assert.deepEqual(errors, []);
      await page.close();
    }
    console.log('PASS: homepage CTA, guided draft reload recovery, price and scope transfer, direct editor, Clear/Undo, mobile labels, overflow, runtime errors');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
