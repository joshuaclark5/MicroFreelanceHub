// Explicit provider TEST facility proof. No application DB writes or live keys.
// Credentials/resources stay outside git; receipts never include their values.
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const Stripe = require('stripe');
const assert = require('node:assert/strict');
const privateRoot = 'C:/Users/joshu/mfh-private-backups/provider-integrations';
const fixturePath = `${privateRoot}/ad-billing-status-fixture.json`;
const receiptPath = 'artifacts/billing-provider-proof.json';
const secrets = JSON.parse(fs.readFileSync(`${privateRoot}/stripe-test-private.json`, 'utf8'));
assert.match(secrets.secretKey, /^sk_test_[A-Za-z0-9]+$/);
const stripe = new Stripe(secrets.secretKey, { apiVersion: '2023-10-16' });
const exportsForTest = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/lib/server/billingStatus.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: exportsForTest, require: name => { assert.equal(name, 'server-only'); return {}; } });
const { verifiedBilling } = exportsForTest;
const marker = 'mfh-ad-billing-status-20261128-v1';
let fixture = fs.existsSync(fixturePath) ? JSON.parse(fs.readFileSync(fixturePath, 'utf8')) : { marker };
const receipt = { startedAt: new Date().toISOString(), providerTest: true, liveCharges: false, applicationWrites: false, checks: [], cleanup: 'pending' };
const save = () => fs.writeFileSync(fixturePath, JSON.stringify(fixture, null, 2));
function owned(object) { assert.equal(object.livemode, false); assert.equal(object.metadata?.fixture, marker); return object; }
(async () => {
  assert.equal(fixture.marker, marker);
  assert.ok(!fixture.finished, 'Already finished. Reuse saved proof; do not recreate unchanged test.');
  if (!fixture.customer) {
    const customer = owned(await stripe.customers.create({ name: 'MFH synthetic billing fixture', payment_method: 'pm_card_visa', invoice_settings: { default_payment_method: 'pm_card_visa' }, metadata: { fixture: marker } }, { idempotencyKey: `${marker}-customer` }));
    fixture.customer = customer.id; save();
  } else owned(await stripe.customers.retrieve(fixture.customer));
  if (!fixture.product) {
    const product = owned(await stripe.products.create({ name: 'MFH TEST ONLY Starter verification', metadata: { fixture: marker } }, { idempotencyKey: `${marker}-product` }));
    fixture.product = product.id; save();
  } else owned(await stripe.products.retrieve(fixture.product));
  if (!fixture.subscription) {
    const subscription = owned(await stripe.subscriptions.create({ customer: fixture.customer, items: [{ price_data: { currency: 'usd', product: fixture.product, unit_amount: 3100, recurring: { interval: 'month' } } }], metadata: { fixture: marker, plan: 'starter' }, payment_behavior: 'error_if_incomplete' }, { idempotencyKey: `${marker}-subscription` }));
    fixture.subscription = subscription.id; save();
  }
  owned(await stripe.subscriptions.retrieve(fixture.subscription));
  const profile = { stripe_customer_id: fixture.customer, subscription_id: fixture.subscription };
  let result = await verifiedBilling(stripe, profile, 'synthetic-owner', false);
  assert.equal(result.verification, 'active'); assert.equal(result.testMode, true); assert.equal(result.plan, 'Starter');
  receipt.checks.push('actual provider active TEST subscription read and labeled test');
  await assert.rejects(verifiedBilling(stripe, profile, 'synthetic-owner', true));
  receipt.checks.push('test subscription rejected in live-mode verifier');
  owned(await stripe.subscriptions.update(fixture.subscription, { cancel_at_period_end: true }, { idempotencyKey: `${marker}-schedule-cancel` }));
  result = await verifiedBilling(stripe, profile, 'synthetic-owner', false);
  assert.equal(result.verification, 'active'); assert.equal(result.cancelAtPeriodEnd, true); assert.equal(result.canCancel, false); assert.ok(result.nextDate);
  receipt.checks.push('scheduled cancellation preserves provider active state and reports effective date');
  owned(await stripe.subscriptions.cancel(fixture.subscription));
  result = await verifiedBilling(stripe, profile, 'synthetic-owner', false);
  assert.equal(result.verification, 'ended'); assert.equal(result.canCancel, false);
  receipt.checks.push('actual provider cancellation read as ended');
  await stripe.products.update(fixture.product, { active: false });
  receipt.cleanup = 'test subscription canceled; synthetic product archived; test customer retained for traceability';
  receipt.status = 'PASS'; fixture.finished = true; save();
})().catch(error => {
  receipt.status = 'FAIL'; receipt.error = { type: error.type || error.name, code: error.code || null };
  process.exitCode = 1;
}).finally(() => {
  fs.mkdirSync('artifacts', { recursive: true });
  fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2));
  console.log(JSON.stringify(receipt));
});
