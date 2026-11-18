'use strict';
// Actual source handlers in an isolated VM; no real SDKs, credentials, database or network.
// Read-only test: emits evidence to stdout, never writes artifacts outside this assignment.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.resolve(__dirname, '..');
const checks = [], hashes = {};
const victim = '00000000-0000-4000-8000-000000000002';
const profiles = [{ id: victim, stripe_account_id: 'acct_existing_fixture', is_pro: true }];
const originalProfiles = structuredClone(profiles);
const effects = { fetch: 0, imports: 0, credentials: 0, database: 0, provider: 0, navigation: 0 };
function forbidden(kind) {
  return () => { effects[kind]++; throw Error('Forbidden effect: ' + kind); };
}
function load(file, mocks = {}, extras = {}) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  hashes[file] = crypto.createHash('sha256').update(source).digest('hex');
  const result = ts.transpileModule(source, {
    fileName: file, reportDiagnostics: true,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React, esModuleInterop: true },
  });
  assert.deepEqual((result.diagnostics || []).filter(d => d.category === ts.DiagnosticCategory.Error), []);
  const exports = {};
  vm.runInNewContext(result.outputText, {
    exports, URL, Request, Response,
    require: name => Object.hasOwn(mocks, name) ? mocks[name] : forbidden('imports')(),
    fetch: forbidden('fetch'),
    process: { env: new Proxy({}, { get: forbidden('credentials') }) },
    window: new Proxy({}, { get: forbidden('navigation'), set: forbidden('navigation') }),
    ...extras,
  }, { filename: file, timeout: 1000 });
  return exports;
}
const next = { NextResponse: { json: (body, init) => Response.json(body, init) } };
// Any attempt to construct privileged clients fails and is counted even if application code catches it.
const mocks = {
  'next/server': next,
  stripe: { default: forbidden('provider') },
  '@supabase/supabase-js': { createClient: forbidden('database') },
  'npm:resend': { Resend: forbidden('provider') },
};
async function unavailable(response, code) {
  assert.equal(response.status, 503);
  assert.equal(response.ok, false);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('location'), null);
  const body = await response.json();
  assert.equal(body.error, code);
  assert.equal(body.success, undefined);
  assert.deepEqual(Object.keys(body).sort(), ['error', 'message']);
  assert.ok(!JSON.stringify(body).includes(victim));
}
function noEffects() {
  assert.deepEqual(effects, { fetch: 0, imports: 0, credentials: 0, database: 0, provider: 0, navigation: 0 });
  assert.deepEqual(profiles, originalProfiles, 'existing payout binding and entitlement unchanged');
}
async function test(name, fn) { await fn(); noEffects(); checks.push(name); console.log('PASS ' + name); }
(async () => {
  const callback = load('app/api/stripe/callback/route.ts', mocks);
  await test('callback import and unauthenticated forged victim requests cannot exchange codes or write/unbind records', async () => {
    assert.equal(callback.dynamic, 'force-dynamic');
    const queries = ['', '?code=fictional-code&state=' + victim, '?state=' + victim,
      '?code=fictional-code', '?error=access_denied&state=' + victim,
      '?code=fictional-code&state=' + victim + '&state=attacker',
      '?code=fictional-code&state=%7B%22userId%22%3A%22victim%22%7D'];
    for (const query of queries) {
      await unavailable(await callback.GET(new Request('https://fixture.invalid/api/stripe/callback' + query)), 'stripe_connect_unavailable');
    }
  });
  await test('forged auth, replay and account switching never enable callback', async () => {
    for (const actor of ['attacker', victim]) {
      for (let replay = 0; replay < 2; replay++) {
        await unavailable(await callback.GET(new Request('https://fixture.invalid/api/stripe/callback?code=fictional-code&state=' + victim, {
          headers: { authorization: 'Bearer forged-' + actor, cookie: 'session=forged-' + actor },
        })), 'stripe_connect_unavailable');
      }
    }
  });
  await test('callback never reads request authority or malformed request fields', async () => {
    await unavailable(await callback.GET(new Proxy({}, { get() { throw Error('Request must be ignored'); } })), 'stripe_connect_unavailable');
  });
  await test('debug unavailable without credential reads, provider responses or external calls', async () => {
    const debug = load('app/api/debug/route.ts', mocks);
    assert.equal(debug.dynamic, 'force-dynamic');
    for (const headers of [{}, { authorization: 'Bearer forged', cookie: 'session=forged' }]) {
      await unavailable(await debug.GET(new Request('https://fixture.invalid/api/debug?key=fictional', { headers })), 'debug_unavailable');
    }
  });
  for (const name of ['dunning-email', 'send-invoice-email', 'welcome-email']) {
    let handler, registrations = 0;
    load('supabase/functions/' + name + '/index.ts', mocks, {
      Deno: { env: { get: forbidden('credentials') }, serve: fn => { registrations++; handler = fn; } },
    });
    assert.equal(registrations, 1);
    assert.equal(typeof handler, 'function');
    await test(name + ' rejects unauthenticated/forged arbitrary recipients, HTML and payment URLs', async () => {
      const payload = { invoice_id: victim, client_email: 'recipient@example.invalid', email: 'recipient@example.invalid',
        client_name: '<b>injected</b>', name: '<b>injected</b>', days_overdue: 30, amount_due: 17,
        project_name: '<a href="https://attacker.invalid">injected</a>', payment_link: 'https://attacker.invalid/not-stripe' };
      for (const auth of [{}, { authorization: 'Bearer forged', apikey: 'forged', cookie: 'session=forged' }]) {
        const request = new Request('https://fixture.invalid/' + name, {
          method: 'POST', headers: { 'content-type': 'application/json', ...auth }, body: JSON.stringify(payload),
        });
        await unavailable(await handler(request), 'legacy_email_unavailable');
        assert.equal(request.bodyUsed, false);
      }
    });
    await test(name + ' malformed bodies and every method including OPTIONS remain unavailable, not queued/sent', async () => {
      for (const method of ['GET', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE']) {
        const request = new Request('https://fixture.invalid/' + name, {
          method, ...(['GET', 'HEAD'].includes(method) ? {} : { body: '{malformed' }),
        });
        const response = await handler(request);
        assert.equal(response.headers.get('access-control-allow-origin'), null);
        await unavailable(response, 'legacy_email_unavailable');
        assert.equal(request.bodyUsed, false);
      }
      await unavailable(await handler(new Proxy({}, { get() { throw Error('Body/headers must not be inspected'); } })), 'legacy_email_unavailable');
    });
  }
  await test('actual Connect component renders disabled truthful UI with no OAuth navigation or active handler', () => {
    const Component = load('app/components/ConnectStripeButton.tsx', { react: React }).default;
    assert.equal(Component({ userId: '' }), null);
    const tree = Component({ userId: victim });
    function inspect(node) {
      if (!React.isValidElement(node)) return;
      assert.equal(node.props.onClick, undefined);
      assert.equal(node.props.href, undefined);
      if (node.type === 'button') { assert.equal(node.props.disabled, true); assert.equal(node.props.type, 'button'); }
      React.Children.forEach(node.props.children, inspect);
    }
    inspect(tree);
    const html = renderToStaticMarkup(tree);
    assert.match(html, /<button[^>]+disabled=""/);
    assert.match(html, /Stripe connection unavailable/);
    assert.match(html, /Existing connection records are unchanged/);
    assert.ok(!html.includes(victim));
    assert.ok(!html.includes('connect.stripe.com'));
  });
  console.log(JSON.stringify({ passed: checks.length, checks, effects, sourceHashes: hashes,
    bounds: ['Actual transpiled handlers and React component; isolated VM and local response/SDK guards only.',
      'No live authentication, existing database, Deno gateway, deployment, provider or browser-runtime proof.'] }, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
