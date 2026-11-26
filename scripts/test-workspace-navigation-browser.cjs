// Local-only regression proof. No real auth, API writes, provider sends or customer data.
// Run against a production build with QA_BASE_URL and, if needed, PLAYWRIGHT_MODULE.
// QA_AUTH_PROJECT_REF must match the public Supabase project baked into that build.
const fs = require('fs'), path = require('path'), assert = require('assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:3098';
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(base).hostname), 'Only loopback test servers are allowed');
const projectRef = process.env.QA_AUTH_PROJECT_REF;
assert.ok(projectRef, 'Set QA_AUTH_PROJECT_REF to the build public auth project reference');
const out = process.env.QA_OUT || path.resolve('artifacts/m01-navigation-regression');
fs.mkdirSync(out, { recursive: true });
const checks = [];
let browser;
const title = 'Good work startswith clear agreements.';
const frames = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
async function fixture(width, { onboarding = false, delayProfile = false } = {}) {
  const context = await browser.newContext({ viewport: { width, height: 950 }, serviceWorkers: 'block' });
  const user = { id: '11111111-1111-4111-8111-111111111111', email: 'navigation@example.test', aud: 'authenticated', role: 'authenticated' };
  let releaseProfile, profileRequested;
  const gate = new Promise(resolve => { releaseProfile = resolve; });
  const requested = new Promise(resolve => { profileRequested = resolve; });
  if (!delayProfile) releaseProfile();
  await context.addCookies([{ name: 'sb-' + projectRef + '-auth-token', value: encodeURIComponent(JSON.stringify({ access_token: 'fixture-token', refresh_token: 'fixture-refresh', expires_at: Math.floor(Date.now()/1000)+3600, token_type: 'bearer', user })), url: base }]);
  await context.addInitScript(() => {
    window.headingFocusCalls = [];
    // Let the modal race test hold application frames until showModal has run.
    // Preserve cancellation so this gate does not resurrect canceled callbacks.
    const nativeRaf = window.requestAnimationFrame.bind(window);
    const nativeCancel = window.cancelAnimationFrame.bind(window);
    const heldFrames = new Map();
    window.requestAnimationFrame = callback => {
      const id = nativeRaf(time => {
        if (window.holdNavigationFrames) heldFrames.set(id, callback);
        else callback(time);
      });
      return id;
    };
    window.cancelAnimationFrame = id => { heldFrames.delete(id); nativeCancel(id); };
    window.releaseNavigationFrames = () => {
      window.holdNavigationFrames = false;
      const callbacks = Array.from(heldFrames.values());
      heldFrames.clear();
      callbacks.forEach(callback => nativeRaf(callback));
    };
    const nativeFocus = HTMLElement.prototype.focus;
    HTMLElement.prototype.focus = function(...args) {
      const heading = this.matches('h1, h2');
      const modalOpen = !!document.querySelector('dialog[open], [aria-modal="true"]');
      const result = nativeFocus.apply(this, args);
      if (heading) window.headingFocusCalls.push({ text: this.textContent, modalOpen, success: document.activeElement === this });
      return result;
    };
  });
  await context.route('**/*', async route => {
    const req = route.request(), url = new URL(req.url());
    if (url.hostname === projectRef + '.supabase.co') {
      assert.equal(req.method(), 'GET', 'Auth/database mutations are not part of this test');
      if (url.pathname === '/auth/v1/user') return route.fulfill({ json: user });
      if (url.pathname === '/rest/v1/profiles') {
        profileRequested();
        await gate;
        return route.fulfill({ json: { id: user.id, is_pro: false, stripe_account_id: null, has_completed_onboarding: !onboarding, full_name: 'Synthetic Owner', business_name: 'Synthetic Studio' } });
      }
      return route.fulfill({ json: [] });
    }
    if (url.origin !== base) return route.abort();
    assert.ok(['GET', 'HEAD'].includes(req.method()), 'No local mutations');
    if (url.pathname.startsWith('/api/')) return route.fulfill({ json: { ownerId: user.id, records: [], complete: true, hasMore: false, nextCursor: null } });
    return route.continue();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  await page.goto(base + '/workspace');
  await page.getByRole('button', { name: 'Log out', exact: true }).first().waitFor();
  const menu = page.locator('.suite-mobile-header details');
  const summary = menu.locator('summary');
  const mobile = page.getByRole('navigation', { name: 'Mobile workspace', exact: true });
  const navigate = async name => {
    await summary.click();
    await mobile.getByRole('link', { name, exact: true }).click();
  };
  const heading = page.locator('.d4-workspace-title h2');
  const assertAgreementsFocus = async () => {
    await heading.waitFor();
    assert.equal(await heading.textContent(), title);
    await page.waitForFunction(() => document.activeElement?.textContent === 'Good work startswith clear agreements.');
    assert.equal(await heading.evaluate(el => el === document.activeElement), true);
    assert.equal(await page.locator('h1').filter({ hasText: 'MicroFreelanceHub' }).getAttribute('tabindex'), null, 'Brand must not become the focus target');
  };
  return { context, page, menu, summary, mobile, navigate, heading, assertAgreementsFocus, releaseProfile, requested };
}
(async () => {
  browser = await chromium.launch({ channel: process.env.QA_BROWSER_CHANNEL || 'msedge', headless: true });
  for (const width of [360, 390, 1440]) {
    const { context, page, menu, summary, mobile, navigate, heading, assertAgreementsFocus } = await fixture(width);
    const focusedH1 = () => page.waitForFunction(() => document.activeElement?.tagName === 'H1');
    if (width < 900) {
      await summary.click();
      await mobile.getByRole('button', { name: 'Close', exact: true }).click();
      assert.equal(await menu.getAttribute('open'), null);
      assert.ok(await summary.evaluate(el => el === document.activeElement));
      await summary.press('Enter');
      await page.keyboard.press('Tab');
      assert.equal(await page.locator(':focus').textContent(), 'Close ×');
      await page.keyboard.press('Enter');
      assert.equal(await menu.getAttribute('open'), null);
      assert.ok(await summary.evaluate(el => el === document.activeElement));
      await summary.press('Enter');
      await page.keyboard.press('Escape');
      assert.equal(await menu.getAttribute('open'), null);
      assert.ok(await summary.evaluate(el => el === document.activeElement));
      checks.push({ width, pointerAndKeyboardCloseAndEscape: true });
      await summary.click();
      assert.equal(await mobile.getByRole('link', { name: 'Home overview', exact: true }).getAttribute('aria-current'), 'page');
      await mobile.getByRole('link', { name: 'Home overview', exact: true }).click();
      await focusedH1();
      assert.equal(await menu.getAttribute('open'), null);
      const homeHeading = page.getByRole('heading', { level: 1 }).first();
      assert.equal(await homeHeading.getAttribute('tabindex'), '-1');
      await summary.focus();
      assert.equal(await homeHeading.getAttribute('tabindex'), null, 'Temporary tabindex removed on blur');
      await homeHeading.evaluate(el => el.setAttribute('tabindex', '0'));
      await navigate('Home overview');
      await focusedH1();
      await summary.focus();
      assert.equal(await homeHeading.getAttribute('tabindex'), '0', 'Existing tabindex preserved after blur');
      await homeHeading.evaluate(el => el.removeAttribute('tabindex'));
      checks.push({ width, sameRouteFocusAndTabindexLifecycle: true });
      await navigate('Tasks');
      await page.waitForURL(base + '/workspace/tasks');
      await focusedH1();
      assert.equal(await menu.getAttribute('open'), null);
      await summary.click();
      assert.equal(await mobile.getByRole('link', { name: 'Tasks', exact: true }).getAttribute('aria-current'), 'page');
      await mobile.getByRole('link', { name: 'Home overview', exact: true }).focus();
      await page.keyboard.press('Enter');
      await page.waitForURL(base + '/workspace');
      await focusedH1();
      assert.equal(await menu.getAttribute('open'), null);
      await page.goBack();
      await page.waitForURL(base + '/workspace/tasks');
      await page.getByRole('heading', { level: 1 }).first().waitFor();
      assert.equal(await menu.getAttribute('open'), null);
      checks.push({ width, crossRoutePointerKeyboardCurrentStateAndBack: true });
      await navigate('Agreements');
      await page.waitForURL(base + '/dashboard');
      await assertAgreementsFocus();
      assert.equal(await heading.getAttribute('tabindex'), '-1');
      await summary.click();
      assert.equal(await heading.getAttribute('tabindex'), null);
      assert.equal(await mobile.getByRole('link', { name: 'Agreements', exact: true }).getAttribute('aria-current'), 'page');
      await mobile.getByRole('link', { name: 'Agreements', exact: true }).focus();
      await page.keyboard.press('Enter');
      await assertAgreementsFocus();
      checks.push({ width, exactAgreementsTitleFocusedNotBrand: true, agreementsSameRouteKeyboard: true });
      await navigate('Settings & billing');
      await page.waitForURL(base + '/settings');
      await focusedH1();
      checks.push({ width, focusAcrossWorkspaceBoundary: true });
      await page.goto(base + '/workspace');
      await summary.click();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: path.join(out, 'menu-' + width + '.png') });
      await page.reload();
      assert.equal(await menu.getAttribute('open'), null);
      checks.push({ width, noHorizontalOverflowAndReloadClosed: true });
    } else {
      assert.equal(await summary.isVisible(), false);
      const desktop = page.getByRole('navigation', { name: 'Workspace', exact: true });
      assert.equal(await desktop.getByRole('link', { name: 'Home overview', exact: true }).getAttribute('aria-current'), 'page');
      await desktop.getByRole('link', { name: 'Tasks', exact: true }).click();
      await page.waitForURL(base + '/workspace/tasks');
      assert.equal(await desktop.getByRole('link', { name: 'Tasks', exact: true }).getAttribute('aria-current'), 'page');
      assert.equal(await page.getByRole('button', { name: 'Close', exact: true }).isVisible(), false);
      checks.push({ width, desktopUnchanged: true });
    }
    await context.close();
  }
  // Real dashboard data-loading state delays mounting its title. No test DOM replacement.
  {
    const f = await fixture(390, { delayProfile: true });
    await f.navigate('Agreements');
    await f.page.waitForURL(base + '/dashboard');
    await f.requested;
    await f.page.getByText('Loading Dashboard...', { exact: true }).waitFor();
    assert.equal(await f.heading.count(), 0);
    f.releaseProfile();
    await f.assertAgreementsFocus();
    checks.push({ delayedDestinationHeadingAppearance: true, exactAgreementsTitleFocused: true });
    await f.context.close();
  }
  // Back cancels the pending handoff while the dashboard still has no heading.
  {
    const f = await fixture(390, { delayProfile: true });
    await f.navigate('Agreements');
    await f.page.waitForURL(base + '/dashboard');
    await f.requested;
    await f.page.getByText('Loading Dashboard...', { exact: true }).waitFor();
    await f.page.goBack();
    await f.page.waitForURL(base + '/workspace');
    f.releaseProfile();
    await frames(f.page);
    // Forward after cancellation must not revive the original menu-focus intent.
    await f.page.goForward();
    await f.page.waitForURL(base + '/dashboard');
    await f.heading.waitFor();
    await frames(f.page);
    assert.equal(await f.heading.getAttribute('tabindex'), null);
    assert.equal(await f.page.evaluate(t => window.headingFocusCalls.some(call => call.text === t), title), false);
    checks.push({ delayedDestinationBackCancelsFocus: true, forwardDoesNotReviveStaleFocus: true });
    await f.context.close();
  }
  // Exercise the actual WelcomeWizard showModal/focus trap with a fresh fixture profile.
  {
    const f = await fixture(390, { onboarding: true, delayProfile: true });
    await f.page.evaluate(() => { window.holdNavigationFrames = true; });
    await f.navigate('Agreements');
    await f.page.waitForURL(base + '/dashboard');
    await f.requested;
    f.releaseProfile();
    const dialog = f.page.getByRole('dialog', { name: 'Start with one client. Keep the next step clear.' });
    await dialog.waitFor();
    await dialog.getByLabel('Your name', { exact: true }).waitFor();
    await f.page.evaluate(() => window.releaseNavigationFrames());
    await frames(f.page);
    assert.equal(await dialog.evaluate(el => el.contains(document.activeElement)), true);
    assert.equal(await f.heading.getAttribute('tabindex'), null);
    for (let n = 0; n < 12; n++) {
      await f.page.keyboard.press('Tab');
      if (!await dialog.evaluate(el => el.contains(document.activeElement))) {
        // Native dialogs may tab to browser chrome, but never to background page controls.
        assert.equal(await f.page.evaluate(() => !document.hasFocus() && document.activeElement === document.body), true);
        await f.page.keyboard.press('Tab');
        assert.equal(await dialog.evaluate(el => el.contains(document.activeElement)), true, 'Returning from browser chrome enters the dialog');
      }
    }
    assert.equal(await f.page.evaluate(t => window.headingFocusCalls.some(call => call.text === t && call.modalOpen), title), false, 'Do not even attempt to focus a background heading');
    await dialog.getByRole('button', { name: 'Set up later', exact: true }).click();
    await dialog.waitFor({ state: 'detached' });
    await frames(f.page);
    assert.equal(await f.heading.getAttribute('tabindex'), null);
    assert.equal(await f.page.evaluate(t => window.headingFocusCalls.some(call => call.text === t), title), false, 'Dismissal does not replay a discarded handoff');
    checks.push({ actualOnboardingModalFocusTrapPreserved: true, noBackgroundFocusAttemptOrFalseSuccess: true, noDeferredFocusAfterDismissal: true });
    await f.context.close();
  }
  console.log('PASS ' + checks.length + ' navigation regression groups');
})().catch(error => { checks.push({ error: String(error), stack: error.stack }); console.error(error); process.exitCode = 1; }).finally(async () => {
  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({ timestamp: new Date().toISOString(), bounds: 'Loopback production build, synthetic auth/data, intercepted API, blocked third-party requests. No real auth/provider/tenant proof.', checks }, null, 2));
  if (browser) await browser.close();
});
