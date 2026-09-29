const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, imports = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText, { exports, process, console, require: key => imports[key] || require(key) });
  return exports;
}
const payment = load('app/lib/agreementPayment.ts');
const record = load('app/lib/recordAgreementPayment.ts', { './agreementPayment': payment });
const id = '00000000-0000-4000-8000-000000000001';
let doc = { id, user_id: 'owner', price: 1000, payment_type: 'one_time', status: 'Signed', signed_by: 'Client', provider_sign: 'Owner', payment_received_cents: 0, payment_schedule_structured: { type: '50', depositAmount: 500 } };
assert.equal(payment.agreementBalance(doc).due, 50000);
assert.equal(payment.agreementBalance({ ...doc, payment_received_cents: 50000 }).due, 50000);
assert.equal(payment.agreementBalance({ ...doc, status: 'Paid' }).due, 0);
assert.equal(payment.agreementBalance({ ...doc, payment_received_cents: 90000, payment_schedule_structured: { type: 'split', depositAmount: 250 } }).due, 10000);
assert.throws(() => payment.agreementBalance({ ...doc, price: -1 }));
let session = { id: 'cs_fixture', status: 'complete', payment_status: 'paid', currency: 'usd', amount_total: 50000, client_reference_id: id, metadata: { purpose: 'agreement_payment', sow_id: id, owner_id: 'owner', expected_amount_cents: '50000' } };
assert.equal(payment.validateAgreementReceipt(session, doc), 50000);
for (const invalid of [ { payment_status: 'unpaid' }, { currency: 'eur' }, { amount_total: 1 }, { client_reference_id: 'other' }, { metadata: {} } ]) {
  assert.throws(() => payment.validateAgreementReceipt({ ...session, ...invalid }, doc));
}
const created = [], recorded = [], profileUpdates = [];
let validSignature = true;
let signedInUser = null, signatureWrites = 0;
const database = {
  from(table) {
    let updating = false;
    const query = {
      select() { return updating ? Promise.resolve({ data: [{ id }], error: null }) : query; },
      eq() { return query; }, or() { return query; },
      update() { updating = true; signatureWrites++; return query; },
      upsert: async value => { profileUpdates.push(value); return { error: null }; },
      single: async () => ({ data: table === 'profiles' ? { stripe_account_id: 'acct_fixture' } : doc, error: null }),
    };
    return query;
  },
  rpc: async (name, args) => { recorded.push({ name, args }); return { error: null }; },
};
class Stripe {
  webhooks = { constructEvent: body => { if (!validSignature) throw Error('invalid signature'); return JSON.parse(body); } };
  checkout = { sessions: {
    create: async config => { created.push(config); return { url: 'https://checkout.stripe.com/fixture' }; },
    retrieve: async () => session,
  } };
}
class NextResponse {
  constructor(body, options) { this.body = body; this.status = options?.status || 200; }
  static json(body, options) { return new NextResponse(body, options); }
}
const imports = {
  'next/server': { NextResponse },
  'next/headers': { headers: () => ({ get: () => 'fixture-signature' }) },
  '@supabase/supabase-js': { createClient: () => database }, stripe: Stripe,
  '../../../lib/agreementPayment': payment,
  '../../../lib/recordAgreementPayment': record,
  '../../lib/recordAgreementPayment': record,
};
const checkout = load('app/api/stripe/checkout/route.ts', imports);
const confirm = load('app/api/sow/mark-paid/route.ts', imports);
const webhook = load('app/api/webhooks/route.ts', imports);
const sign = load('app/actions/signSOW.ts', {
  '@supabase/supabase-js': { createClient: () => database },
  '@supabase/auth-helpers-nextjs': { createServerActionClient: () => ({ auth: { getUser: async () => ({ data: { user: signedInUser } }) } }) },
  'next/headers': { cookies: () => ({}) },
});
const request = body => ({ json: async () => body });
(async () => {
  assert.equal((await checkout.POST(request({ sowId: id, amount: 0.01 }))).status, 200);
  assert.equal(created[0].line_items[0].price_data.unit_amount, 50000, 'Never trust a browser-supplied amount');
  assert.equal(created[0].metadata.sow_id, id);
  assert.ok(created[0].success_url.includes('session_id={CHECKOUT_SESSION_ID}'));
  doc.signed_by = null;
  assert.equal((await checkout.POST(request({ sowId: id }))).status, 409);
  doc.signed_by = 'Client';
  delete doc.payment_received_cents;
  assert.equal((await checkout.POST(request({ sowId: id }))).status, 503);
  doc.payment_received_cents = 0;
  assert.equal((await confirm.POST(request({ sowId: id }))).status, 400);
  session.payment_status = 'unpaid';
  assert.equal((await confirm.POST(request({ sowId: id, sessionId: 'cs_fixture' }))).status, 409);
  assert.equal(recorded.length, 0);
  session.payment_status = 'paid';
  assert.equal((await confirm.POST(request({ sowId: id, sessionId: 'cs_fixture' }))).status, 200);
  assert.equal(recorded[0].args.p_amount_cents, 50000);
  assert.equal(recorded[0].args.p_sow_id, id);
  doc.provider_sign = null;
  assert.ok((await sign.signContract(id, 'Owner', 'provider')).error);
  signedInUser = { id: 'other-user' };
  assert.ok((await sign.signContract(id, 'Owner', 'provider')).error);
  assert.equal(signatureWrites, 0);
  signedInUser = { id: 'owner' };
  assert.equal((await sign.signContract(id, 'Owner', 'provider')).success, true);
  assert.ok((await sign.signContract(id, 'Client', 'invalid')).error);
  assert.ok((await sign.signContract(id, 'Client', 'client')).error, 'Existing signatures cannot be overwritten');
  const event = value => ({ text: async () => JSON.stringify({ type: 'checkout.session.completed', data: { object: value } }) });
  validSignature = false;
  assert.equal((await webhook.POST(event(session))).status, 400);
  validSignature = true;
  const before = recorded.length;
  assert.equal((await webhook.POST(event({ ...session, payment_status: 'unpaid' }))).status, 200);
  assert.equal(recorded.length, before);
  assert.equal((await webhook.POST(event(session))).status, 200);
  assert.equal(recorded.length, before + 1);
  assert.equal(profileUpdates.length, 0, 'Agreement payment must never grant a SaaS subscription');
  assert.equal((await webhook.POST(event({ ...session, mode: 'subscription', subscription: 'sub_fixture', metadata: { plan: 'pro' }, client_reference_id: 'owner' }))).status, 200);
  assert.equal(profileUpdates.length, 1);
  assert.equal(profileUpdates[0].id, 'owner');
  console.log('PASS: server pricing, partial balances, unpaid/wrong-document rejection, migration gate, Stripe-bound confirmation, provider authorization and signature overwrite guards. Providers mocked; SQL transaction not exercised.');
})().catch(error => { console.error(error); process.exitCode = 1; });
