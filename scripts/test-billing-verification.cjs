const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
let actor = { id: 'owner' }, profile = { stripe_customer_id: 'cus_one', subscription_id: 'sub_one' }, profileError = null;
let list, session, providerFailure = false, calls = 0;
const stripe = { subscriptions: { async list(options) { assert.equal(options.expand, undefined); calls++; if (providerFailure) throw Error('SECRET provider payload'); return list; } }, checkout: { sessions: { async retrieve() { calls++; return session; } } } };
const logs = [];
function load(file) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 } }).outputText, {
    exports, console: { warn: x => logs.push(x) }, process: { env: { STRIPE_SECRET_KEY: 'sk_live_fixture' } },
    require(name) {
      if (name === 'server-only') return {};
      if (name === 'stripe') return { default: function() { return stripe; } };
      if (name === 'next/headers') return { cookies: () => ({}) };
      if (name === 'next/server') return { NextResponse: { json: (body, options) => ({ body, ...options }) } };
      if (name === 'next/link') return { default: ({ children, ...props }) => React.createElement('a', props, children) };
      if (name === '@supabase/auth-helpers-nextjs') {
        const client = () => ({ auth: { getUser: async () => ({ data: { user: actor }, error: null }) }, from() { return { select() { return { eq(field, value) { assert.equal(field, 'id'); assert.equal(value, actor.id); return { maybeSingle: async () => ({ data: profile, error: profileError }) }; } }; } }; } });
        return { createServerComponentClient: client, createRouteHandlerClient: client };
      }
      if (name.startsWith('.')) return load(path.resolve(path.dirname(file), name + '.ts'));
      return require(name);
    },
  });
  return exports;
}
function reset(status = 'active', live = true) {
  providerFailure = false; calls = 0; actor = { id: 'owner' }; profileError = null;
  profile = { stripe_customer_id: 'cus_one', subscription_id: 'sub_one' };
  list = { has_more: false, data: [{ id: 'sub_one', customer: 'cus_one', livemode: live, status, metadata: { plan: 'starter' }, cancel_at_period_end: false, current_period_end: 1800000000, items: { data: [{ price: { recurring: { interval_count: 1, interval: 'month' }, product: { name: 'Starter' } } }] } }] };
  session = { customer: 'cus_one', client_reference_id: 'owner', mode: 'subscription', livemode: live, subscription: 'sub_one', status: 'complete', payment_status: 'paid' };
}
(async () => {
  const { verifiedBilling: verify, billingLiveMode } = load('app/lib/server/billingStatus.ts');
  const check = (live = true, sid) => verify(stripe, profile, 'owner', live, sid);
  reset(); assert.equal((await check(true, 'cs_live_one')).verification, 'active');
  assert.equal((await check()).nextDate, new Date(1800000000000).toISOString());
  for (const [status, expected] of [['trialing', 'trial'], ['past_due', 'pending'], ['unpaid', 'pending'], ['incomplete', 'pending'], ['paused', 'pending'], ['canceled', 'ended'], ['incomplete_expired', 'ended']]) { reset(status); assert.equal((await check()).verification, expected); }
  reset(); list.data[0].cancel_at_period_end = true; assert.equal((await check()).verification, 'active'); assert.equal((await check()).canCancel, false);
  reset(); session.payment_status = 'unpaid'; assert.equal((await check(true, 'cs_live_one')).verification, 'pending'); assert.equal(calls, 1);
  for (const change of [s => s.customer = 'cus_other', s => s.client_reference_id = 'other', s => s.mode = 'payment', s => s.livemode = false]) { reset(); change(session); await assert.rejects(check(true, 'cs_live_one')); }
  reset(); await assert.rejects(check(true, ['cs_live_one']));
  reset(); list.has_more = true; await assert.rejects(check());
  reset(); list.data.push({ ...list.data[0], id: 'sub_two' }); await assert.rejects(check());
  reset(); list.data[0].customer = 'cus_other'; await assert.rejects(check());
  reset(); list.data = []; await assert.rejects(check());
  reset(); providerFailure = true; await assert.rejects(check());
  reset('active', false); assert.equal((await check(false)).testMode, true); await assert.rejects(check(true));
  assert.equal(billingLiveMode('sk_test_fixture'), false); assert.throws(() => billingLiveMode(undefined));
  reset(); profile = null; assert.equal((await check()).verification, 'none'); assert.equal(calls, 0);
  const page = load('app/payment-success/page.tsx');
  const render = async query => renderToStaticMarkup(await page.default({ searchParams: query || {} }));
  reset(); actor = null; let html = await render({ plan: 'agency', session_id: 'cs_live_stolen', lead_source: 'PRIVATE' }); assert.ok(html.includes('Sign in to check')); assert.equal(calls, 0); assert.ok(!html.includes('PRIVATE')); assert.ok(!html.includes('Paid plan activated'));
  reset(); html = await render(); assert.ok(html.includes('Your subscription is active')); assert.ok(!html.includes('cus_one'));
  reset(); providerFailure = true; html = await render(); assert.ok(html.includes('could not verify')); assert.ok(!html.includes('SECRET')); assert.ok(!html.includes('Your subscription is active'));
  reset(); profileError = { message: 'PRIVATE' }; html = await render(); assert.ok(html.includes('could not verify')); assert.equal(calls, 0);
  reset(); session.client_reference_id = 'other'; html = await render({ session_id: 'cs_live_one' }); assert.ok(html.includes('could not verify'));
  reset(); const route = load('app/api/stripe/subscription/route.ts'); providerFailure = true; const failure = await route.GET(); assert.equal(failure.status, 502); assert.equal(failure.headers['Cache-Control'], 'private, no-store'); assert.ok(!JSON.stringify(failure).includes('SECRET'));
  reset(); actor = null; assert.equal((await route.GET()).status, 401);
  assert.ok(logs.every(x => /^billing_(return|status)_verification_unavailable$/.test(x)));
  console.log('PASS: provider/account/environment binding; pending/trial/failure/cancel states; duplicate/partial lookup refusal; actual SSR return and API; no writes, charges or conversion events. Provider mocked.');
})().catch(error => { console.error(error); process.exitCode = 1; });
