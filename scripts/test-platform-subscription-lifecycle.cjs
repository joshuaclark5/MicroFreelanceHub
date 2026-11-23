const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
async function run(options = {}) {
  let profile = { id: 'owner', stripe_customer_id: 'cus_one', subscription_id: 'sub_one', is_pro: true, ...options.profile };
  const writes = [];
  const current = { id: 'sub_one', customer: 'cus_one', status: 'trialing', metadata: { userId: 'owner' }, ...options.current };
  const session = { mode: 'subscription', subscription: 'sub_one', customer: 'cus_one', client_reference_id: 'owner', payment_status: 'no_payment_required', metadata: { plan: 'pro' } };
  const event = { type: options.type || 'customer.subscription.updated', data: { object: options.type === 'checkout.session.completed' ? session : { id: 'sub_one', status: 'active' } } };
  const db = { from: () => ({
    select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: profile }) }) }),
    upsert: async value => { writes.push(value); profile = { ...profile, ...value }; return {}; },
    update: value => ({ eq: (key, expected) => ({ eq: async (key2, expected2) => {
      if (options.dbError) return { error: new Error('private') };
      if (profile[key] === expected && profile[key2] === expected2) { writes.push(value); profile = { ...profile, ...value }; }
      return {};
    } }) }),
  }) };
  class NextResponse { constructor(body, init) { this.body = body; this.status = init?.status || 200; } static json(body, init) { return new NextResponse(body, init); } }
  class Stripe { constructor() {
    this.webhooks = { constructEvent: () => { if(options.badSignature) throw Error('invalid'); return event; } };
    this.subscriptions = { retrieve: async id => { if (options.providerError) throw Error('private'); return id === current.id ? current : { status: 'active' }; } };
  } }
  const imports = {
    'next/headers': { headers: () => ({ get: () => 'fixture' }) },
    'next/server': { NextResponse }, stripe: { default: Stripe },
    '@supabase/supabase-js': { createClient: () => db },
    '../../lib/recordAgreementPayment': { recordAgreementPayment: () => { throw Error('unexpected agreement mutation'); } },
  };
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/api/webhooks/route.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, {
    exports, require: name => { if (!(name in imports)) throw Error(name); return imports[name]; }, process: { env: {} }, console: { log() {}, warn() {}, error() {} },
  });
  const response = await exports.POST({ text: async () => '{}' });
  return { response, writes, profile };
}
(async () => {
  for (const status of ['active', 'trialing', 'canceled', 'past_due', 'unpaid', 'paused', 'incomplete_expired']) {
    const x = await run({ current: { status } });
    assert.equal(x.response.status, 200); assert.equal(x.profile.is_pro, ['active', 'trialing'].includes(status));
  }
  const trial = await run({ type: 'checkout.session.completed', profile: { subscription_id: null, is_pro: false } });
  assert.equal(trial.profile.is_pro, true, 'Zero-cost trial checkout grants access only after provider verification');
  for (const current of [{ status: 'canceled' }, { customer: 'cus_other' }, { metadata: { userId: 'other' } }]) {
    assert.equal((await run({ type: 'checkout.session.completed', current })).writes.length, 0);
  }
  for (const profile of [{ subscription_id: 'sub_newer' }, { stripe_customer_id: 'cus_other' }]) {
    assert.equal((await run({ current: { status: 'canceled' }, profile })).writes.length, 0);
  }
  assert.equal((await run({ type: 'checkout.session.completed', profile: { subscription_id: 'sub_newer' } })).writes.length, 0);
  assert.equal((await run({ dbError: true })).response.status, 500);
  assert.equal((await run({ providerError: true })).response.status, 500);
  assert.equal((await run({ badSignature: true })).response.status, 400);
  console.log('PASS subscription lifecycle: trial, renewal, expired access, replay/current-state, account mapping, newer subscriptions and retry failures (mocked providers).');
})().catch(e => { console.error(e); process.exitCode = 1; });
