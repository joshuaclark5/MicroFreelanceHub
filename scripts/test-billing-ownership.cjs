// Actual handlers + shared verifier, fictional providers only; unexpected imports fail closed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, mocks = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, { exports, require: name => {
    if (!Object.hasOwn(mocks, name)) throw Error('Unexpected dependency: ' + name);
    return mocks[name];
  }, URL, process: { env: { NEXT_PUBLIC_BASE_URL: 'https://fixture.invalid', STRIPE_SECRET_KEY: 'fictional-not-a-key' } }, console: { error() {} } });
  return exports;
}
const ownership = load('app/lib/stripeCustomerOwnership.ts', {'server-only': {}});
const attribution = load('app/lib/profileAttribution.ts');
const receipt = load('app/lib/subscriptionReceipt.ts');
const own = {id: 'cus_fixture', email: 'same@fixture.invalid', metadata: {supabase_id: 'owner'}};
let cases = 0;
function fixture(options = {}) {
  const calls = [];
  const state = {
    user: {id: 'owner', email: 'same@fixture.invalid'},
    profile: {id: 'owner', stripe_customer_id: own.id, subscription_id: 'sub_fixture', is_pro: true},
    customer: structuredClone(own), ...options,
  };
  const record = (name, value) => calls.push({name, value});
  const db = {
    auth: {
      getUser: async () => ({data: {user: state.user}, error: state.authError}),
      admin: {getUserById: async id => { assert.equal(id, 'owner'); return {data: {user: state.user}}; }},
    },
    from(table) {
      assert.equal(table, 'profiles');
      const q = {
        select: () => q,
        eq: (key, value) => { assert.equal(key, 'id'); assert.equal(value, 'owner'); return q; },
        maybeSingle: async () => ({data: state.profile, error: state.profileError}),
        single: async () => ({data: state.profile, error: state.profileError}),
        upsert: async (row, config) => {
          record('profile.upsert', row);
          assert.ok(!('is_pro' in row) && !('subscription_id' in row));
          if (state.saveError && row.stripe_customer_id) return {error: Error('private db error')};
          if (!state.profile) state.profile = {...row};
          else if (!config.ignoreDuplicates) Object.assign(state.profile, row);
          return {};
        },
        update: () => { throw Error('No attribution update expected in this fixture'); },
      };
      return q;
    },
  };
  const subscription = {id: 'sub_fixture', customer: own.id, status: 'active', metadata: {userId: 'owner', plan: 'pro'}, cancel_at_period_end: false, items: {data: [{current_period_end: 1900000000, price: {product: {name: 'Professional'}, recurring: {interval: 'month', interval_count: 1}}}]}};
  class Stripe {
    customers = {
      retrieve: async id => { record('customer.retrieve', id); if (state.providerError) throw Error('private provider token/customer details'); return state.customer; },
      create: async args => { record('customer.create', args); state.customer = {id: 'cus_new', metadata: args.metadata}; return state.customer; },
      update: async () => { throw Error('Must never claim or edit a customer'); },
    };
    subscriptions = {
      list: async args => { record('subscription.list', args); return {data: state.noSubscriptions ? [] : [subscription]}; },
      retrieve: async id => { record('subscription.retrieve', id); return subscription; },
      update: async () => { throw Error('No direct cancellation or entitlement mutation'); },
      cancel: async () => { throw Error('Cancellation remains portal-only'); },
    };
    checkout = {sessions: {
      create: async args => { record('checkout.create', args); return {url: 'https://checkout.fixture.invalid'}; },
      retrieve: async id => { record('checkout.retrieve', id); return {id, customer: state.profile.stripe_customer_id, subscription: 'sub_fixture', client_reference_id: 'owner', mode: 'subscription', status: 'complete', payment_status: 'paid', metadata: {plan: 'pro'}}; },
    }};
    billingPortal = {sessions: {create: async args => { record('portal.create', args); return {url: 'https://portal.fixture.invalid'}; }}};
  }
  const mocks = {
    'server-only': {}, 'next/server': {NextResponse: {json: (body, init = {}) => ({body, status: init.status || 200, headers: init.headers})}},
    'next/headers': {cookies: () => ({})}, stripe: {default: Stripe},
    '@supabase/supabase-js': {createClient: () => db},
    '@supabase/auth-helpers-nextjs': {createRouteHandlerClient: () => db, createServerComponentClient: () => db},
    '../../../lib/stripeCustomerOwnership': ownership, '../../lib/stripeCustomerOwnership': ownership,
    '../../../lib/profileAttribution': attribution, '../../../lib/subscriptionReceipt': receipt,
  };
  const handlers = {
    checkout: load('app/api/stripe/checkout-plan/route.ts', mocks).POST,
    portal: load('app/api/stripe/create-portal/route.ts', mocks).POST,
    list: load('app/api/stripe/subscription/route.ts', mocks).GET,
    receipt: load('app/api/stripe/checkout-status/route.ts', mocks).GET,
    toolkit: load('app/challenge/toolkit/access.ts', mocks).toolkitAccess,
  };
  return {state, calls, invoke: (name, body = {}) => handlers[name]({url: 'https://fixture.invalid/api/stripe/checkout-status?session_id=cs_fixture', json: async () => ({userId: 'owner', plan: 'pro', ...body})})};
}
const downstream = calls => calls.filter(c => ['checkout.create', 'portal.create', 'subscription.list', 'subscription.retrieve', 'customer.create'].includes(c.name));
(async () => {
  const failures = [
    ['foreign, matching email and forged profile/subscription/is_pro tuple', {customer: {...own, metadata: {supabase_id: 'victim'}}}],
    ['deleted', {customer: {id: own.id, deleted: true}}],
    ['missing metadata', {customer: {id: own.id, email: own.email}}],
    ['empty metadata', {customer: {...own, metadata: {}}}],
    ['missing customer', {customer: null}],
    ['wrong returned customer id', {customer: {...own, id: 'cus_other'}}],
    ['provider error', {providerError: true}],
  ];
  for (const [label, options] of failures) for (const name of ['checkout', 'portal', 'list', 'receipt', 'toolkit']) {
    const f = fixture(options);
    for (let retry = 0; retry < 2; retry++) {
      const result = await f.invoke(name);
      if (name === 'toolkit') assert.equal(result, 'unavailable', label);
      else if (name === 'receipt') assert.equal(result.body.state, 'unavailable', label);
      else assert.equal(result.status, options.providerError ? (name === 'list' ? 502 : 500) : 403, label);
      assert.equal(downstream(f.calls).length, 0, name + ': ' + label);
      assert.ok(!JSON.stringify(result).includes('private provider') && !JSON.stringify(result).includes('private db'), 'No error details leak');
    }
    assert.equal(f.calls.filter(c => c.name === 'customer.retrieve').length, 2, 'Recheck ownership, never cached');
    assert.ok(!f.calls.some(c => c.name === 'profile.upsert' && c.value.stripe_customer_id));
    cases++;
  }
  for (const badId of ['', 'cus_bad/path', 123, {id: own.id}]) {
    const f = fixture({profile: {stripe_customer_id: badId}});
    assert.equal((await f.invoke('checkout')).status, 403);
    assert.equal(downstream(f.calls).length, 0);
    assert.equal(f.calls.filter(c => c.name === 'customer.retrieve').length, 0);
    cases++;
  }
  for (const name of ['checkout', 'portal', 'list', 'receipt', 'toolkit']) {
    const f = fixture();
    const result = await f.invoke(name);
    if (name === 'toolkit') assert.equal(result, 'allowed');
    else { assert.equal(result.status, 200); if (name === 'receipt') assert.equal(result.body.state, 'confirmed'); }
    assert.ok(f.calls.findIndex(c => c.name === 'customer.retrieve') < f.calls.findIndex(c => downstream([c]).length), name + ' verifies first');
    assert.equal(f.calls.filter(c => c.name === 'customer.create').length, 0);
    // A previously valid customer is not trusted on the next request.
    f.state.customer = {...own, metadata: {supabase_id: 'other'}};
    const previous = downstream(f.calls).length;
    await f.invoke(name);
    assert.equal(downstream(f.calls).length, previous);
    cases++;
  }
  for (const [plan, amount] of [['starter', 900], ['pro', 2900], ['agency', 7900]]) for (const existing of [true, false]) {
    const f = fixture(existing ? {} : {profile: null});
    assert.equal((await f.invoke('checkout', {plan})).status, 200);
    assert.equal((await f.invoke('checkout', {plan})).status, 200);
    const sessions = f.calls.filter(c => c.name === 'checkout.create');
    assert.equal(sessions.length, 2, 'Preserves existing checkout behavior, not new session deduplication');
    for (const {value: s} of sessions) {
      assert.equal(s.line_items[0].price_data.unit_amount, amount);
      assert.equal(s.line_items[0].price_data.currency, 'usd');
      assert.equal(s.line_items[0].price_data.recurring.interval, 'month');
      assert.equal(s.line_items[0].quantity, 1);
      assert.equal(s.allow_promotion_codes, true); // Existing config only, no promotion created.
      assert.equal(s.client_reference_id, 'owner');
      assert.equal(s.subscription_data.metadata.userId, 'owner');
    }
    assert.equal(f.calls.filter(c => c.name === 'customer.create').length, existing ? 0 : 1, 'Sequential reuse creates no duplicate customer');
    if (!existing) assert.equal(f.calls.find(c => c.name === 'customer.create').value.metadata.supabase_id, 'owner');
    cases++;
  }
  for (const name of ['checkout', 'portal', 'list', 'receipt', 'toolkit']) for (const authError of [false, true]) {
    const f = fixture(authError ? {authError: Error('auth failed')} : {user: null});
    const result = await f.invoke(name);
    assert.equal(name === 'toolkit' ? result : result.status, name === 'toolkit' ? 'signin' : 401);
    assert.equal(f.calls.length, 0);
    cases++;
  }
  const mismatch = fixture();
  assert.equal((await mismatch.invoke('checkout', {userId: 'victim', stripe_customer_id: 'cus_victim'})).status, 403);
  assert.equal(mismatch.calls.length, 0);
  const saveFailure = fixture({profile: null, saveError: true});
  assert.equal((await saveFailure.invoke('checkout')).status, 500);
  assert.ok(!saveFailure.calls.some(c => c.name === 'checkout.create'));
  const free = fixture({profile: null});
  assert.equal((await free.invoke('list')).body.canManage, false);
  assert.equal((await free.invoke('portal')).status, 404);
  assert.equal(await free.invoke('toolkit'), 'upgrade');
  assert.equal(free.calls.length, 0);
  const empty = fixture({noSubscriptions: true});
  assert.equal((await empty.invoke('list')).body.canCancel, false);
  assert.equal((await empty.invoke('portal', {userId: 'victim', customer: 'cus_victim'})).status, 200);
  assert.equal(empty.calls.find(c => c.name === 'portal.create').value.customer, own.id, 'Portal/cancel ignores body association');
  // Cancellation is deliberately not a new endpoint: both UI buttons use this same gate.
  const settings = fs.readFileSync('app/settings/page.tsx', 'utf8');
  assert.ok(settings.slice(settings.indexOf('const handleCancelSubscription')).includes("fetch('/api/stripe/create-portal'"));
  console.log('PASS: ' + (cases + 5) + ' billing ownership fixture cases; actual handlers and verifier, no real providers. Repeated denial/recheck, sequential customer reuse, portal-only cancellation, immutable prices, no entitlement writes.');
})().catch(error => {console.error(error); process.exitCode = 1;});
