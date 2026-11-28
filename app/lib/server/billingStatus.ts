import 'server-only';

export class BillingVerificationError extends Error {}
type BillingProfile = { stripe_customer_id?: string | null; subscription_id?: string | null };
export type VerifiedBilling = {
  plan: string; status: string; cycle: string; nextDate: string | null;
  cancelAtPeriodEnd: boolean; canCancel: boolean; canManage: boolean;
  verification: 'none' | 'active' | 'trial' | 'pending' | 'ended'; testMode: boolean;
};
const id = (value: any): string | null => typeof value === 'string' ? value : typeof value?.id === 'string' ? value.id : null;

// Read-only: no access writes or conversion events. A return URL is not payment proof.
export async function verifiedBilling(stripe: any, profile: BillingProfile | null, actor: string, liveMode: boolean, sessionId?: unknown): Promise<VerifiedBilling> {
  const customer = profile?.stripe_customer_id;
  const none: VerifiedBilling = { plan: 'Free', status: 'No subscription', cycle: 'None', nextDate: null, cancelAtPeriodEnd: false, canCancel: false, canManage: !!customer, verification: 'none', testMode: !liveMode };
  if (!customer) return none;
  if (!/^cus_[a-zA-Z0-9]+$/.test(customer)) throw new BillingVerificationError('Invalid customer reference');
  let returnedSubscription: string | null = null;
  if (sessionId !== undefined) {
    if (typeof sessionId !== 'string' || !/^cs_(?:test_|live_)?[a-zA-Z0-9]+$/.test(sessionId)) throw new BillingVerificationError('Invalid checkout reference');
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.livemode !== liveMode || id(session.customer) !== customer || session.client_reference_id !== actor || session.mode !== 'subscription') throw new BillingVerificationError('Checkout ownership mismatch');
    returnedSubscription = id(session.subscription);
    if (!returnedSubscription || session.status !== 'complete' || !['paid', 'no_payment_required'].includes(session.payment_status)) {
      return { ...none, plan: 'Subscription', status: 'Payment confirmation pending', verification: 'pending' };
    }
  }
  const subscriptions = await stripe.subscriptions.list({ customer, status: 'all', limit: 100 });
  if (subscriptions.has_more || !Array.isArray(subscriptions.data)) throw new BillingVerificationError('Incomplete subscription lookup');
  for (const subscription of subscriptions.data) {
    if (subscription.livemode !== liveMode || id(subscription.customer) !== customer) throw new BillingVerificationError('Subscription environment or ownership mismatch');
  }
  const current = subscriptions.data.filter((s: any) => !['canceled', 'incomplete_expired'].includes(s.status));
  if (current.length > 1) throw new BillingVerificationError('Multiple current subscriptions require reconciliation');
  const subscription = returnedSubscription
    ? subscriptions.data.find((s: any) => s.id === returnedSubscription)
    : current[0] || subscriptions.data.find((s: any) => s.id === profile?.subscription_id);
  if (!subscription) {
    if (returnedSubscription || profile?.subscription_id) throw new BillingVerificationError('Linked subscription not found');
    return none;
  }
  const item = subscription.items?.data?.[0];
  let product = item?.price?.product;
  const names: Record<string, string> = { starter: 'Starter', pro: 'Professional', agency: 'Agency' };
  if (!names[subscription.metadata?.plan] && typeof product === 'string') {
    product = await stripe.products.retrieve(product);
    if (!product.deleted && product.livemode !== liveMode) throw new BillingVerificationError('Product environment mismatch');
  }
  const plan = names[subscription.metadata?.plan] || (typeof product?.name === 'string' && !product.deleted ? product.name : 'Subscription');
  const recurring = item?.price?.recurring;
  const timestamp = subscription.cancel_at || subscription.current_period_end || item?.current_period_end;
  const nextDate = typeof timestamp === 'number' && Number.isFinite(timestamp) && timestamp > 0 ? new Date(timestamp * 1000).toISOString() : null;
  const ended = ['canceled', 'incomplete_expired'].includes(subscription.status);
  return {
    plan, status: String(subscription.status).replace(/_/g, ' '),
    cycle: recurring ? `${recurring.interval_count} ${recurring.interval}${recurring.interval_count > 1 ? 's' : ''}` : 'Unavailable',
    nextDate, cancelAtPeriodEnd: !ended && (!!subscription.cancel_at_period_end || !!subscription.cancel_at),
    canManage: true, canCancel: !ended && !subscription.cancel_at_period_end && !subscription.cancel_at,
    verification: ended ? 'ended' : subscription.status === 'active' ? 'active' : subscription.status === 'trialing' ? 'trial' : 'pending',
    testMode: !liveMode,
  };
}

export function billingLiveMode(key: string | undefined): boolean {
  if (!key || !/^sk_(live|test)_[a-zA-Z0-9]+$/.test(key)) throw new BillingVerificationError('Billing configuration unavailable');
  return key.startsWith('sk_live_');
}
