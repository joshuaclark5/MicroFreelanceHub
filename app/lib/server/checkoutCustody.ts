import Stripe from 'stripe';

export class CheckoutConflict extends Error {}

// Never retry an uncertain creation after Stripe's minimum idempotency retention.
// Preserve the operation for reconciliation instead of risking a second customer/session.
export async function ownedCheckout(stripe: Stripe, db: any, owner: string,
  customerParams: Stripe.CustomerCreateParams, params: Stripe.Checkout.SessionCreateParams) {
  const request = JSON.parse(JSON.stringify({ customer: customerParams, session: params }));
  async function rpc(name: string, args: Record<string, unknown>) {
    const { data, error } = await db.rpc(name, args);
    if (error || !data) throw new Error('Checkout custody unavailable');
    return data;
  }
  let attempt = await rpc('mfh_checkout_attempt', { p_owner: owner, p_request: request });
  for (let pass = 0; pass < 2; pass++) {
    let session: Stripe.Checkout.Session | null = null;
    if (attempt.session_id) {
      session = await stripe.checkout.sessions.retrieve(attempt.session_id);
      if (session.customer !== attempt.customer_id || session.client_reference_id !== owner ||
          session.metadata?.checkout_operation !== attempt.operation_id) throw new Error('Checkout ownership mismatch');
      if (session.status === 'expired') {
        attempt = await rpc('mfh_checkout_attempt', { p_owner: owner, p_request: request, p_expired_operation: attempt.operation_id });
        continue;
      }
      if (session.status === 'complete') throw new CheckoutConflict('Your checkout is being reconciled. Check your subscription in Settings.');
    }
    if (!attempt.matches) throw new CheckoutConflict('A different checkout is already open. Finish it or wait for it to expire before choosing another offer.');
    if (!session) {
      const age = Date.now() - Date.parse(attempt.created_at);
      if (!Number.isFinite(age) || age < -60000 || age > 23 * 3600000) throw new CheckoutConflict('This checkout needs reconciliation before another can start. Contact support.');
      if (!attempt.customer_id) {
        const customer = await stripe.customers.create(attempt.request.customer, { idempotencyKey: `mfh-customer-${attempt.operation_id}` });
        attempt = { ...attempt, ...await rpc('mfh_checkout_record', { p_owner: owner, p_operation: attempt.operation_id, p_customer: customer.id }) };
      }
      session = await stripe.checkout.sessions.create({ ...attempt.request.session,
        customer: attempt.customer_id,
        expires_at: Math.floor(Date.parse(attempt.created_at) / 1000) + 3600,
        metadata: { ...attempt.request.session.metadata, checkout_operation: attempt.operation_id },
      }, { idempotencyKey: `mfh-checkout-${attempt.operation_id}` });
      await rpc('mfh_checkout_record', { p_owner: owner, p_operation: attempt.operation_id, p_customer: attempt.customer_id, p_session: session.id });
      if (session.status === 'expired') {
        attempt = await rpc('mfh_checkout_attempt', { p_owner: owner, p_request: request, p_expired_operation: attempt.operation_id });
        continue;
      }
    }
    if (session.status !== 'open' || !session.url) throw new CheckoutConflict('Your checkout is being reconciled. Check your subscription in Settings.');
    return session;
  }
  throw new CheckoutConflict('Checkout changed while loading. Please retry.');
}
