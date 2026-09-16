const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, imports = {}) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(source, { exports, require: name => imports[name] || require(name), process, console });
  return exports;
}

const { isEmailTemplate, templateBadge } = load('app/lib/templateType.ts');
assert.ok(isEmailTemplate('Late Payment Reminder Email Template', 'late-payment-reminder-email-after-no-response'));
assert.ok(isEmailTemplate('Scope Creep Reply Template', 'scope-creep-reply-template'));
assert.ok(isEmailTemplate(null, 'late-payment-email-designer'));
assert.equal(isEmailTemplate('Invoice', 'crane-operator-invoice-template'), false);
assert.equal(templateBadge('Workflow Template'), 'Workflow Template');
assert.equal(templateBadge('Invoice'), 'Invoice Template');

let signedIn = true, customer = null, fail = false, records = [];
const auth = { auth: { getUser: async () => ({ data: { user: signedIn ? { id: 'current-user' } : null } }) },
  from: () => ({ select: () => ({ eq: (_, id) => {
    assert.equal(id, 'current-user');
    return { maybeSingle: async () => ({ data: { stripe_customer_id: customer } }) };
  } }) }) };
class Stripe {
  subscriptions = { list: async () => { if (fail) throw Error('provider failure'); return { data: records }; } };
}
const { GET } = load('app/api/stripe/subscription/route.ts', {
  'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status || 200 }) } },
  'next/headers': { cookies: () => ({}) },
  '@supabase/auth-helpers-nextjs': { createRouteHandlerClient: () => auth }, stripe: Stripe,
});
(async () => {
  assert.equal((await GET()).body.plan, 'Free');
  signedIn = false;
  assert.equal((await GET()).status, 401);
  signedIn = true; customer = 'test-customer';
  records = [{ status: 'trialing', metadata: {}, cancel_at_period_end: false, items: { data: [{ current_period_end: 1900000000, price: { product: { name: 'Professional' }, recurring: { interval: 'month', interval_count: 1 } } }] } }];
  assert.equal((await GET()).body.plan, 'Professional');
  assert.equal((await GET()).body.status, 'trialing');
  records[0].cancel_at_period_end = true;
  assert.equal((await GET()).body.canCancel, false);
  records[0].status = 'past_due';
  assert.equal((await GET()).body.status, 'past due');
  records[0].status = 'canceled';
  assert.equal((await GET()).body.status, 'No subscription');
  fail = true;
  assert.equal((await GET()).status, 502);
  console.log('PASS: template classification, labels, billing free/trial/past-due/canceled/error/auth states');
})().catch(error => { console.error(error); process.exitCode = 1; });
