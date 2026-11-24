const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, imports) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {
    exports, URL, URLSearchParams, require: name => { if (!(name in imports)) throw Error(name); return imports[name]; },
    process: { env: { NEXT_PUBLIC_BASE_URL: 'https://example.test' } }, console: { error() {} },
  });
  return exports;
}
const pricing = load('app/lib/planPricing.ts', {});
const helper = load('app/lib/profileAttribution.ts', {});
async function check(options = {}) {
  let row = options.row ? { ...options.row } : null;
  const sessions = [], customers = [], writes = [];
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
    stripe: { default: class { constructor() { this.subscriptions={list:async()=>({data:options.subscriptions||[],has_more:!!options.hasMore})}; this.customers = { create: async value => { customers.push(value); return { id: 'cus_mock' }; } }; this.checkout = { sessions: { create: async value => { sessions.push(value); return { url: 'https://example.test/checkout' }; } } }; } } },
    '@supabase/supabase-js': { createClient: () => db },
    '@supabase/auth-helpers-nextjs': { createRouteHandlerClient: () => ({ auth: { getUser: async () => ({ data: { user: options.unauthorized ? null : { id: 'owner' } } }) } }) },
    '../../../lib/planPricing': pricing,
    'next/headers': { cookies: () => {} }, '../../../lib/profileAttribution': helper,
  });
  const result = await POST({ json: async () => ({ pricingVersion: pricing.PRICING_VERSION, plan: 'pro', userId: 'owner', landingPage: '/pricing?email=secret', leadSource: 'later', ...options.body }) });
  return { result, row, sessions, customers, writes };
}
(async () => {
  for (const stripe_customer_id of [null, 'cus_existing']) {
    const x = await check({ row: { id: 'owner', stripe_customer_id, signup_landing_page: '/templates/mechanic', lead_source: 'original' } });
    assert.equal(x.result.status, 200);
    assert.equal(x.row.lead_source, 'original');
    assert.equal(x.sessions[0].metadata.landing_page, '/templates/mechanic');
    assert.equal(x.sessions[0].subscription_data.metadata.lead_source, 'original');
    assert.equal(x.sessions[0].line_items[0].price_data.unit_amount, 5400);
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
  for (const [plan, amount] of [['starter', 3100], ['agency', 12400]]) {
    const x = await check({ body: { plan } });
    assert.equal(x.sessions[0].line_items[0].price_data.unit_amount, amount);
  }
  for(const [plan,amount] of [['starter',28800],['pro',52800],['agency',124800]]){
    const x=await check({body:{plan,billingCycle:'annual'}});
    assert.equal(x.result.status,200);
    assert.equal(x.sessions[0].line_items[0].price_data.unit_amount,amount);
    assert.equal(x.sessions[0].line_items[0].price_data.recurring.interval,'year');
    assert.equal(x.sessions[0].subscription_data.metadata.billing_cycle,'annual');
  }
  for(const body of [{pricingVersion:'old'},{pricingVersion:undefined},{billingCycle:'weekly'},{billingCycle:null}]){
    const x=await check({body});assert.ok([400,409].includes(x.result.status));assert.equal(x.sessions.length,0);assert.equal(x.customers.length,0);
  }
  for(const status of ['active','trialing','past_due','unpaid','paused','incomplete']){
    const x=await check({row:{id:'owner',stripe_customer_id:'cus_existing'},subscriptions:[{status}]});assert.equal(x.result.status,409);assert.equal(x.sessions.length,0);
  }
  const bounded=await check({row:{id:'owner',stripe_customer_id:'cus_existing'},hasMore:true});assert.equal(bounded.result.status,409);
  const canceled=await check({row:{id:'owner',stripe_customer_id:'cus_existing'},subscriptions:[{status:'canceled'}]});assert.equal(canceled.result.status,200);
  const callback=load('app/auth/callback/route.ts',{
    '@supabase/auth-helpers-nextjs':{createRouteHandlerClient:()=>({auth:{getUser:async()=>({data:{user:{id:'owner'}}})}})},
    '@supabase/supabase-js':{createClient:()=>({})},'next/headers':{cookies:()=>({})},
    'next/server':{NextResponse:{redirect:url=>url}},'../../lib/profileAttribution':{persistFirstTouch:async()=>{}},
  });
  for(const cycle of ['monthly','annual']){const url=await callback.GET({url:'https://example.test/auth/callback?plan=agency&billing='+cycle});assert.equal(url.pathname,'/checkout-plan');assert.equal(url.searchParams.get('billing'),cycle);assert.equal(url.searchParams.get('plan'),'agency');}
  console.log('PASS: checkout preserves first touch, sanitizes metadata, checks six new prices and intervals, blocks stale prices and existing subscriptions, and rejects unauthorized/invalid requests. All Stripe and database calls mocked.');
})().catch(error => { console.error(error); process.exitCode = 1; });
