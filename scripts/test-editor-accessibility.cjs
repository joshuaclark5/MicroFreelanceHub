const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/joshu/AppData/Roaming/npm/node_modules/openclaw/node_modules/playwright-core');
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:3042';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const seoPage = await browser.newPage();
    const inventory = async origin => {
      const response = await seoPage.request.get(`${origin}/sitemap.xml`);
      assert.equal(response.status(), 200);
      const xml = await response.text();
      return seoPage.evaluate(text => Array.from(new DOMParser().parseFromString(text, 'application/xml').getElementsByTagName('loc'), el => el.textContent).sort(), xml);
    };
    const liveUrls = await inventory('https://www.microfreelancehub.com');
    assert.ok(liveUrls.length >= 1511);
    assert.deepEqual(await inventory(base), liveUrls, 'Sitemap inventory must match production');
    console.log(`PASS: ${liveUrls.length} sitemap URLs preserved`);
    await seoPage.close();
    for (const width of [1440, 390, 320]) {
      const page = await browser.newPage({ viewport: { width, height: 950 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/*', route => {
        const request = route.request();
        if (/google-analytics|googletagmanager/.test(request.url())) return route.abort();
        if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
          return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
        }
        return route.continue();
      });
      await page.goto(`${base}/create?mode=editor`);
      await page.getByRole('textbox', { name: 'Agreement text', exact: true }).waitFor();
      await page.getByRole('link', { name: 'Back to dashboard', exact: true }).waitFor();
      for (const name of ['Client Name', 'Client Email', 'Payment Due Date', 'Manual Total Price', 'Tax Rate (%)', 'Balance Due Date']) {
        assert.equal(await page.getByLabel(name, { exact: true }).count(), 1, name);
      }
      await page.getByLabel('Invoice item description').fill('QA design');
      await page.getByLabel('Invoice item quantity').fill('2');
      await page.getByLabel('Invoice item price').fill('50');
      await page.getByRole('button', { name: 'Add invoice item', exact: true }).click();
      await page.getByRole('button', { name: 'Remove invoice item: QA design', exact: true }).click();
      const installments = page.getByRole('switch', { name: 'Split into Installments?', exact: true });
      assert.equal(await installments.getAttribute('aria-checked'), 'false');
      await installments.focus();
      await page.keyboard.press('Space');
      assert.equal(await installments.getAttribute('aria-checked'), 'true');
      assert.equal(await page.getByLabel('Payments', { exact: true }).count(), 1);
      assert.equal(await page.getByLabel('Every (Days)', { exact: true }).count(), 1);
      await installments.click();
      const reminders = page.getByRole('switch', { name: 'Automated Late Reminders', exact: true });
      const initial = await reminders.getAttribute('aria-checked');
      await reminders.click();
      assert.notEqual(await reminders.getAttribute('aria-checked'), initial);
      await reminders.click();
      const unnamed = await page.locator('button, input, select, textarea').evaluateAll(elements => elements.filter(el => {
        if (!el.getClientRects().length || el.type === 'hidden') return false;
        return !(el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') ||
          Array.from(el.labels || []).some(label => label.textContent.trim()) ||
          (el.tagName === 'BUTTON' && el.textContent.trim()));
      }).map(el => el.outerHTML.slice(0, 180)));
      assert.deepEqual(unnamed, [], 'Visible controls need accessible names');
      for (const name of ['Unlock AI', 'Undo', 'Clear']) {
        const bounds = await page.getByRole('button', { name, exact: true }).boundingBox();
        assert.ok(bounds && bounds.x >= 0 && bounds.x + bounds.width <= width, `${name} stays within viewport`);
      }
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: `editor-accessibility-${width}.png`, fullPage: true });
      assert.deepEqual(errors, []);
      await page.close();
    }
    console.log('PASS: editor names, associated labels, keyboard switches, invoice controls, mobile overflow');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
