const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());
const Stripe = require('stripe');
(async () => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const counts = { open: 0, complete: 0, expired: 0, paid: 0, legacyAgreement: 0, inspected: 0 };
  for await (const session of stripe.checkout.sessions.list({ limit: 100, created: { gte: Math.floor(Date.now()/1000) - 31*86400 } })) {
    counts.inspected++;
    if (session.status in counts) counts[session.status]++;
    if (session.payment_status === 'paid') counts.paid++;
    if ((session.success_url || '').includes('/sow/') && session.metadata?.purpose !== 'agreement_payment') counts.legacyAgreement++;
  }
  console.log(JSON.stringify(counts));
})().catch(e => { console.error(e.type || 'Stripe access failed', e.code || '', e.statusCode || ''); process.exitCode=1; });
