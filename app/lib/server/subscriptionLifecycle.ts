import 'server-only';

export const SUBSCRIPTION_EVENTS = new Set([
  'checkout.session.completed', 'checkout.session.async_payment_succeeded',
  'customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted',
  'invoice.paid', 'invoice.payment_failed',
]);
const ref = (v: any): string | null => typeof v === 'string' ? v : typeof v?.id === 'string' ? v.id : null;
const terminal = (status: string) => ['canceled', 'incomplete_expired', 'unpaid'].includes(status);

// Called only after Stripe signature verification. Re-read current provider state
// instead of applying a stale event body. Test and Connect events cannot grant MFH access.
export async function reconcileSubscriptionEvent(event: any, stripe: any, database: any) {
  if (!SUBSCRIPTION_EVENTS.has(event.type)) return 'ignored';
  if (event.livemode !== true || event.account) return 'ignored_non_platform_live';
  const parameters = await prepareSubscriptionEvent(event, stripe, database, true);
  if (typeof parameters === 'string') return parameters;
  const { data, error } = await database.rpc('apply_mfh_subscription_event', parameters);
  if (error) throw new Error('Billing reconciliation could not be recorded');
  return data;
}

// Read/validate only (plus an observation ticket), never grants access. Shared
// normalization can be verified with real test objects in an isolated test DB.
// The production mutation entry above has no caller-selectable mode.
export async function prepareSubscriptionEvent(event: any, stripe: any, database: any, expectedLiveMode: boolean) {
  if (!SUBSCRIPTION_EVENTS.has(event.type)) return 'ignored';
  if (event.livemode !== expectedLiveMode || event.account) return 'ignored_environment';
  const object = event.data?.object;
  if (!object || object.livemode !== expectedLiveMode) throw new Error('Subscription environment mismatch');
  let subscriptionId: string | null = null;
  let checkout: any = null;
  let invoice: any = null;
  if (event.type.startsWith('checkout.')) {
    if (object.mode !== 'subscription' || object.metadata?.purpose === 'agreement_payment') return 'ignored_non_subscription';
    checkout = await stripe.checkout.sessions.retrieve(object.id);
    if (checkout.id !== object.id || checkout.livemode !== expectedLiveMode || checkout.mode !== 'subscription') throw new Error('Checkout environment mismatch');
    if (checkout.status !== 'complete' || !['paid', 'no_payment_required'].includes(checkout.payment_status)) return 'ignored_pending_checkout';
    subscriptionId = ref(checkout.subscription);
  } else if (event.type.startsWith('invoice.')) {
    invoice = await stripe.invoices.retrieve(object.id);
    if (invoice.id !== object.id || invoice.livemode !== expectedLiveMode) throw new Error('Invoice environment mismatch');
    subscriptionId = ref(invoice.subscription) || ref(invoice.parent?.subscription_details?.subscription);
    if (!subscriptionId) return 'ignored_non_subscription_invoice';
  } else subscriptionId = ref(object);
  if (!subscriptionId || !/^sub_[a-zA-Z0-9]+$/.test(subscriptionId)) throw new Error('Subscription reference missing');
  const { data: ticket, error: ticketError } = await database.rpc('mfh_subscription_ticket');
  if (ticketError || !ticket) throw new Error('Billing reconciliation unavailable');
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  if (subscription.livemode !== expectedLiveMode || subscription.id !== subscriptionId) throw new Error('Subscription environment mismatch');
  const customer = ref(subscription.customer);
  if (!customer || (checkout && ref(checkout.customer) !== customer) || (invoice && ref(invoice.customer) !== customer)) throw new Error('Billing customer mismatch');
  const { data: profiles, error } = await database.from('profiles').select('id,stripe_customer_id,subscription_id,is_pro').eq('stripe_customer_id', customer).limit(2);
  if (error || !Array.isArray(profiles) || profiles.length !== 1) throw new Error('Billing owner unresolved');
  const profile = profiles[0];
  if ((subscription.metadata?.userId && subscription.metadata.userId !== profile.id) || (checkout && checkout.client_reference_id !== profile.id)) throw new Error('Billing actor mismatch');
  const selectedPlan = subscription.metadata?.plan;
  const plan = ['starter', 'pro', 'agency'].includes(selectedPlan) ? selectedPlan : profile.subscription_id === subscriptionId ? 'legacy' : null;
  if (!plan) throw new Error('New subscription offer unrecognized');
  let applyState = true;
  if (profile.subscription_id && profile.subscription_id !== subscriptionId) {
    const linked = await stripe.subscriptions.retrieve(profile.subscription_id);
    if (linked.livemode !== expectedLiveMode || ref(linked.customer) !== customer) throw new Error('Existing subscription ownership mismatch');
    // Historical invoices still record once but cannot overwrite a newer active subscription.
    applyState = terminal(linked.status) && !terminal(subscription.status);
  }
  // A subscription event may arrive before its invoice event. Only an actual paid
  // invoice enters the revenue ledger, never a checkout URL or active status alone.
  let paidInvoice: any = null;
  if (invoice?.status === 'paid' && invoice.paid === true) {
    if (!Number.isSafeInteger(invoice.amount_paid) || invoice.amount_paid < 0 || !/^[a-z]{3}$/.test(invoice.currency) || !Number.isFinite(invoice.status_transitions?.paid_at)) throw new Error('Paid invoice details unavailable');
    paidInvoice = invoice;
  }
  let grantAccess = false;
  if (subscription.status === 'active' && !profile.is_pro) {
    const latestId = ref(subscription.latest_invoice);
    if (latestId) {
      const latest = invoice?.id === latestId ? invoice : await stripe.invoices.retrieve(latestId);
      const latestSubscription = ref(latest.subscription) || ref(latest.parent?.subscription_details?.subscription);
      if (latest.id !== latestId || latest.livemode !== expectedLiveMode || ref(latest.customer) !== customer || latestSubscription !== subscriptionId) throw new Error('Latest invoice ownership mismatch');
      grantAccess = latest.status === 'paid' && latest.paid === true;
      if (grantAccess) {
        if (!Number.isSafeInteger(latest.amount_paid) || latest.amount_paid < 0 || !/^[a-z]{3}$/.test(latest.currency) || !Number.isFinite(latest.status_transitions?.paid_at)) throw new Error('Latest invoice details unavailable');
        paidInvoice = paidInvoice || latest;
      }
    }
  }
  return {
    p_owner: profile.id, p_customer: customer, p_subscription: subscriptionId,
    p_expected_subscription: profile.subscription_id, p_ticket: ticket,
    p_event: event.id, p_type: event.type, p_status: subscription.status, p_plan: plan, p_apply_state: applyState, p_grant_access: grantAccess,
    p_invoice: paidInvoice?.id || null,
    p_paid_at: paidInvoice ? new Date(paidInvoice.status_transitions.paid_at * 1000).toISOString() : null,
    p_amount: paidInvoice?.amount_paid ?? null, p_currency: paidInvoice?.currency || null,
  };
}
