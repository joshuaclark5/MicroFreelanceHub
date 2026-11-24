// Production-page interaction with intercepted auth; no accounts or emails created.
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/joshu/AppData/Roaming/npm/node_modules/openclaw/node_modules/playwright-core');
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:3057';
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    for (const width of [320, 1440]) {
      for (const [query, expected] of [
        ['returnTo=/workspace/clients', '/workspace/clients'],
        ['next=/workspace/setup', '/workspace/setup'],
        ['next=https://outside.invalid', null],
      ]) {
        const page = await browser.newPage({ viewport: { width, height: 950 } });
        const callbacks = [];
        await page.route('**/*', async route => {
          const request = route.request(), url = new URL(request.url());
          if (url.pathname.startsWith('/auth/v1/')) {
            if (url.pathname.endsWith('/authorize') || url.pathname.endsWith('/signup')) {
              callbacks.push(new URL(url.searchParams.get('redirect_to')));
            }
            return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
          }
          if (url.origin !== new URL(base).origin || !['GET', 'HEAD'].includes(request.method())) return route.abort();
          return route.continue();
        });
        await page.goto(base + '/login?' + query);
        await page.getByPlaceholder('Email address').fill('fictional@example.invalid');
        await page.getByPlaceholder('Password', { exact: true }).fill('Fictional-test-only-123');
        await page.getByRole('button', { name: 'Create account', exact: true }).click();
        await page.getByText(/Check your email to confirm your account/).waitFor();
        assert.equal(callbacks.length, 1);
        assert.equal(callbacks[0].searchParams.get('next'), expected);
        assert.equal(callbacks[0].origin, new URL(base).origin);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        await page.screenshot({ path: `artifacts/login-destination-${width}-${expected === null ? 'rejected' : expected.split('/').pop()}.png`, fullPage: true });
        await page.getByRole('button', { name: 'Continue with Google' }).click();
        await page.waitForURL(url => url.pathname.endsWith('/authorize'));
        assert.equal(callbacks.length, 2);
        assert.equal(callbacks[1].searchParams.get('next'), expected);
        assert.equal(callbacks[1].origin, new URL(base).origin);
        await page.close();
      }
    }
    console.log('PASS Google and email-confirmation destination wiring at 320/1440px; unsafe destinations rejected. All auth intercepted.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
