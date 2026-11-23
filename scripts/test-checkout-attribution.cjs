const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, imports, env = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {
    exports, require: name => { if (!(name in imports)) throw Error(name); return imports[name]; },
    process: { env: { NEXT_PUBLIC_BASE_URL: 'https://example.test', ...env } }, console: { error() {} },
  });
  return exports;
}
const helper = load('app/lib/profileAttribution.ts', {});
async function check(options = {}) {
  let row = options.row ? { ...options.row } : null;
  const sessions = [], customers = [], writes = [], keys = [];
  const db = {
    auth: { admin: { async getUserById() { return { data: { user: { id: 'owner', email: 'test@example.test', user_metadata: options.metadata || {} } } }; } } },
    from() { return {
      async upsert(value, config) { writes.push(value); if (!row) row = { ...value }; else if (!config.ignoreDuplicates) Object.assign(row, value); return {}; },
      update(value) { return { eq() { return { async is(field) { if (row[field] == null) Object.assign(row, value); return {}; } }; } }; },
      select() { return { eq() { return { async maybeSingle() { return { data: row, error: options.profileError ? new Error('private database details') : null }; } }; } }; },
    }; },
  };
  const { POST } = load('app/api/stripe/checkout-plan/route.ts', {
    'next/server': { NextResponse: { json: (body, init = {}) => ({ body, status: init.status || 200 }) } },
    stripe: { default: class { constructor() { this.customers = { create: async value => { customers.push(value); return { id: 'cus_mock' }; } }; this.subscriptions = { list: async () => ({ data: options.history || [], has_more: !!options.more }) }; this.checkout = { sessions: { list: async () => ({ data: options.open || [], has_more: false }), create: async (value, config) => { keys.push(config.idempotencyKey); sessions.push(value); return { url: 'https://example.test/checkout' }; } } }; } } },
    '@supabase/supabase-js': { createClient: () => db },
    '@supabase/auth-helpers-nextjs': { createRouteHandlerClient: () => ({ auth: { getUser: async () => ({ data: { user: options.unauthorized ? null : { id: 'owner' } } }) } }) },
    'next/headers': { cookies: () => {} }, '../../../lib/profileAttribution': helper,
  }, { MFH_SEVEN_DAY_TRIAL_ENABLED: options.trial ? 'true' : 'false' });
  const result = await POST({ json: async () => ({ plan: 'pro', userId: 'owner', landingPage: '/pricing?email=secret', leadSource: 'later', ...options.body }) });
  return { result, row, sessions, customers, writes, keys };
}
(async () => {
  for (const stripe_customer_id of [null, 'cus_existing']) {
    const x = await check({ row: { id: 'owner', stripe_customer_id, signup_landing_page: '/templates/mechanic', lead_source: 'original' } });
    assert.equal(x.result.status, 200);
    assert.equal(x.row.lead_source, 'original');
    assert.equal(x.sessions[0].metadata.landing_page, '/templates/mechanic');
    assert.equal(x.sessions[0].subscription_data.metadata.lead_source, 'original');
    assert.equal(x.sessions[0].line_items[0].price_data.unit_amount, 2900);
    assert.equal(x.customers.length, stripe_customer_id ? 0 : 1);
    assert.equal(x.writes.some(w => 'lead_source' in w), false);
  }
  const filled = await check({ metadata: { signup_landing_page: '/create', signup_lead_source: 'partner' } });
  assert.equal(filled.row.lead_source, 'partner');
  assert.equal(filled.sessions[0].metadata.landing_page, '/create');
  const referred = await check({ metadata: { signup_landing_page: '/templates/tennis-coach-contract-template', signup_lead_source: 'referrer:www.google.com' } });
  assert.equal(referred.sessions[0].subscription_data.metadata.lead_source, 'referrer:www.google.com');
  const invalid = await check({ body: { landingPage: '/sow/private', leadSource: 'private@example.test' } });
  assert.equal(invalid.sessions[0].metadata.lead_source, '');
  assert.equal(invalid.sessions[0].metadata.landing_page, '');
  for (const [options, status] of [[{ unauthorized: true }, 401], [{ body: { userId: 'other' } }, 403], [{ body: { plan: '__proto__' } }, 400], [{ profileError: true }, 500]]) {
    const x = await check(options);
    assert.equal(x.result.status, status);
    assert.equal(x.sessions.length, 0);
    assert.equal(x.customers.length, 0);
  }
  for (const [plan, amount] of [['starter', 900], ['agency', 7900]]) {
    const x = await check({ body: { plan } });
    assert.equal(x.sessions[0].line_items[0].price_data.unit_amount, amount);
  }
  assert.equal((await check({ trial: true })).sessions[0].subscription_data.trial_period_days, 7);
  assert.equal((await check()).sessions[0].subscription_data.trial_period_days, undefined);
  assert.equal((await check({ trial: true, history: [{ status: 'canceled' }] })).sessions[0].subscription_data.trial_period_days, undefined);
  for (const status of ['active', 'trialing', 'past_due', 'unpaid', 'paused', 'incomplete']) {
    const x = await check({ trial: true, history: [{ status }] });
    assert.equal(x.result.status, 409); assert.equal(x.sessions.length, 0);
  }
  assert.equal((await check({ more: true })).result.status, 409);
  const reused = await check({ open: [{ mode: 'subscription', status: 'open', metadata: { plan: 'pro' }, url: 'https://example.test/existing' }] });
  assert.equal(reused.result.body.url, 'https://example.test/existing'); assert.equal(reused.sessions.length, 0);
  assert.equal((await check({ open: [{ mode: 'subscription', status: 'open', metadata: { plan: 'starter' } }] })).result.status, 409);
  assert.equal((await check({ body: { plan: 'starter' } })).keys[0], (await check({ body: { plan: 'pro' } })).keys[0], 'Concurrent plan selections must share an account-wide idempotency key');
  const expired = await check({ open: [{ id: 'cs_expired', mode: 'subscription', status: 'expired' }] });
  assert.equal(expired.result.status, 200);
  assert.equal(expired.keys[0], 'platform-checkout-owner-cs_expired');
  assert.equal((await check({ open: [{ id: 'cs_done', mode: 'subscription', status: 'complete' }] })).result.status, 409);
  console.log('PASS: checkout preserves first touch, sanitizes metadata, retains prices, and rejects unauthorized/invalid requests. All Stripe and database calls mocked.');
})().catch(error => { console.error(error); process.exitCode = 1; });
