// Actual handlers + shared verifier, fictional providers only; unexpected imports fail closed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, mocks = {}, env = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, { exports, require: name => {
    if (!Object.hasOwn(mocks, name)) throw Error('Unexpected dependency: ' + name);
    return mocks[name];
  }, URL, process: { env: { NEXT_PUBLIC_BASE_URL: 'https://fixture.invalid', STRIPE_SECRET_KEY: 'fictional-not-a-key', NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:9', SUPABASE_SERVICE_ROLE_KEY: 'fixture-service', ...env } }, console: { error() {} } });
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
      getUser: async () => { if (state.authThrows) throw Error('private auth details'); return {data: {user: state.user}, error: state.authError}; },
      admin: {getUserById: async id => { assert.equal(id, 'owner'); return {data: {user: state.user}, error: state.adminError}; }},
    },
    from(table) {
      assert.equal(table, 'profiles');
      const q = {
        select: () => q,
        eq: (key, value) => { assert.equal(key, 'id'); assert.equal(value, 'owner'); return q; },
        maybeSingle: async () => ({data: state.profile, error: state.profileError}),
        single: async () => ({data: state.profile, error: state.profileError}),
        upsert: async (row, config) => {
          record('profile.upsert', row); if (state.attributionError) return {error: Error('private attribution details')};
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
    constructor(key) { if (!key) throw Error('Missing Stripe key'); }
    customers = {
      retrieve: async id => { record('customer.retrieve', id); if (state.providerError) throw Error('private provider token/customer details'); return state.customer; },
      create: async args => { record('customer.create', args); if (state.failAt === 'customer.create') throw Error('private provider details'); state.customer = {id: 'cus_new', metadata: args.metadata}; return state.customer; },
      update: async () => { throw Error('Must never claim or edit a customer'); },
    };
    subscriptions = {
      list: async args => { record('subscription.list', args); if (state.failAt === 'subscription.list') throw Error('private provider details'); return {data: state.noSubscriptions ? [] : [subscription]}; },
      retrieve: async id => { record('subscription.retrieve', id); if (state.failAt === 'subscription.retrieve') throw Error('private provider details'); return subscription; },
      update: async () => { throw Error('No direct cancellation or entitlement mutation'); },
      cancel: async () => { throw Error('Cancellation remains portal-only'); },
    };
    checkout = {sessions: {
      create: async args => { record('checkout.create', args); if (state.failAt === 'checkout.create') throw Error('private provider details'); return {url: 'https://checkout.fixture.invalid'}; },
      retrieve: async id => { record('checkout.retrieve', id); if (state.failAt === 'checkout.retrieve') throw Error('private provider details'); return {id, customer: state.profile.stripe_customer_id, subscription: 'sub_fixture', client_reference_id: 'owner', mode: 'subscription', status: 'complete', payment_status: 'paid', metadata: {plan: 'pro'}}; },
    }};
    billingPortal = {sessions: {create: async args => { record('portal.create', args); if (state.failAt === 'portal.create') throw Error('private provider details'); return {url: 'https://portal.fixture.invalid'}; }}};
  }
  const mocks = {
    'server-only': {}, 'next/server': {NextResponse: {json: (body, init = {}) => ({body, status: init.status || 200, headers: init.headers})}},
    'next/headers': {cookies: () => ({})}, stripe: {default: Stripe},
    '@supabase/supabase-js': {createClient: (url, key) => { if (!url || !key) throw Error('Missing Supabase config'); return db; }},
    '@supabase/auth-helpers-nextjs': {createRouteHandlerClient: () => db, createServerComponentClient: () => db},
    '../../../lib/stripeCustomerOwnership': ownership, '../../lib/stripeCustomerOwnership': ownership,
    '../../../lib/profileAttribution': attribution, '../../../lib/subscriptionReceipt': receipt,
  };
  const paths = {
    checkout: ['app/api/stripe/checkout-plan/route.ts', 'POST'],
    portal: ['app/api/stripe/create-portal/route.ts', 'POST'],
    list: ['app/api/stripe/subscription/route.ts', 'GET'],
    receipt: ['app/api/stripe/checkout-status/route.ts', 'GET'],
    toolkit: ['app/challenge/toolkit/access.ts', 'toolkitAccess'],
  };
  const handlers = {};
  return {state, calls, invoke: (name, body = {}) => {
    // Load only the requested real module, then reuse it across repeat requests.
    const [file, method] = paths[name];
    handlers[name] ||= load(file, mocks, state.env)[method];
    return handlers[name]({url: 'https://fixture.invalid/api/stripe/checkout-status?session_id=cs_fixture', json: async () => ({userId: 'owner', plan: 'pro', ...body})});
  }};
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
  // Independent review: all handler error exits, absent associations, minimal output.
  const names = ['checkout', 'portal', 'list', 'receipt', 'toolkit'];
  const failureStatus = {checkout:500, portal:500, list:502, receipt:502};
  function unavailable(name, result) {
    if (name === 'toolkit') assert.equal(result, 'unavailable');
    else { assert.equal(result.status, failureStatus[name], name); assert.ok(!JSON.stringify(result.body).includes('private')); }
  }
  for (const name of names) {
    const f = fixture({authThrows:true});
    unavailable(name, await f.invoke(name));
    assert.equal(f.calls.length, 0);
    cases++;
  }
  for (const name of names) {
    const f = fixture({profileError:Error('private database details')});
    const result = await f.invoke(name);
    if(name==='portal') assert.equal(result.status,404); else unavailable(name,result);
    assert.equal(downstream(f.calls).length,0);
    cases++;
  }
  for (const name of names) {
    const f=fixture({env:{STRIPE_SECRET_KEY:undefined}});
    unavailable(name,await f.invoke(name));
    assert.equal(downstream(f.calls).length,0);
    cases++;
  }
  for (const name of ['checkout','portal']) for (const variable of ['NEXT_PUBLIC_SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY']) {
    const f=fixture({env:{[variable]:undefined}});
    unavailable(name,await f.invoke(name));
    assert.equal(downstream(f.calls).length,0);
    cases++;
  }
  for (const [name,failAt] of [['checkout','customer.create'],['checkout','checkout.create'],['portal','portal.create'],['list','subscription.list'],['receipt','checkout.retrieve'],['receipt','subscription.retrieve'],['toolkit','subscription.list']]) {
    const f=fixture({failAt,...(failAt==='customer.create'?{profile:null}:{})});
    unavailable(name,await f.invoke(name));
    if(failAt==='customer.create') assert.ok(!f.calls.some(c=>c.name==='checkout.create'||(c.name==='profile.upsert'&&c.value.stripe_customer_id)));
    if(failAt==='checkout.retrieve') assert.ok(!f.calls.some(c=>c.name==='customer.retrieve'||c.name==='subscription.retrieve'));
    cases++;
  }
  for (const option of [{adminError:Error('private admin details')},{attributionError:true}]) {
    const f=fixture(option), result=await f.invoke('checkout');
    assert.equal(result.status,option.adminError?404:500);
    assert.equal(downstream(f.calls).length,0); cases++;
  }
  for (const profile of [null,{stripe_customer_id:null},{}]) for(const name of ['portal','list','receipt','toolkit']) {
    const f=fixture({profile}),result=await f.invoke(name);
    if(name==='portal')assert.equal(result.status,404);
    if(name==='list'){assert.equal(result.body.plan,'Free');assert.equal(result.body.canManage,false);}
    if(name==='receipt')assert.equal(result.body.state,'unavailable');
    if(name==='toolkit')assert.equal(result,'upgrade');
    assert.equal(f.calls.length,0);cases++;
  }
  for(const badId of ['cus_wrong/path',123,{id:own.id},'cus_'+ 'a'.repeat(241)]) for(const name of names) {
    const f=fixture({profile:{stripe_customer_id:badId}}),result=await f.invoke(name);
    if(name==='toolkit')assert.equal(result,'unavailable');
    else if(name==='receipt')assert.equal(result.body.state,'unavailable');
    else assert.equal(result.status,403);
    assert.equal(downstream(f.calls).length,0);
    assert.ok(!f.calls.some(c=>c.name==='customer.retrieve')); cases++;
  }
  for(const name of ['list','receipt']) {
    const f=fixture(),result=await f.invoke(name);
    const expected=name==='list'?['canCancel','canManage','cancelAtPeriodEnd','cycle','nextDate','plan','status']:['plan','state'];
    assert.equal(Object.keys(result.body).sort().join(','),expected.sort().join(','));
    for(const secret of ['cus_fixture','sub_fixture','same@fixture.invalid','supabase_id','userId'])assert.ok(!JSON.stringify(result.body).includes(secret));
    cases++;
  }

  // Cancellation is deliberately not a new endpoint: both UI buttons use this same gate.
  const settings = fs.readFileSync('app/settings/page.tsx', 'utf8');
  assert.ok(settings.slice(settings.indexOf('const handleCancelSubscription')).includes("fetch('/api/stripe/create-portal'"));
  console.log('PASS: ' + (cases + 5) + ' billing ownership fixture cases; actual handlers and verifier, no real providers. Repeated denial/recheck, sequential customer reuse, portal-only cancellation, immutable prices, no entitlement writes.');
})().catch(error => {console.error(error); process.exitCode = 1;});
