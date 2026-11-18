// Read-only receipt verification. Query strings and is_pro alone never prove a purchase.
export type SubscriptionReceipt = { state: 'confirmed' | 'pending' | 'unavailable'; plan?: string };
export function subscriptionReceipt(session: any, subscription: any, profile: any, userId: string): SubscriptionReceipt {
  const id = (value: any) => typeof value === 'string' ? value : value?.id;
  if (!userId || !profile?.stripe_customer_id || session?.client_reference_id !== userId ||
      id(session?.customer) !== profile.stripe_customer_id || session?.mode !== 'subscription' ||
      !id(session?.subscription) || id(session.subscription) !== subscription?.id ||
      id(subscription?.customer) !== profile.stripe_customer_id ||
      subscription?.metadata?.userId !== userId) return { state: 'unavailable' };
  if (session.status !== 'complete' || session.payment_status !== 'paid' ||
      subscription.status !== 'active' || profile.subscription_id !== subscription.id || profile.is_pro !== true) return { state: 'pending' };
  const plans: Record<string, string> = { starter: 'Starter', pro: 'Professional', agency: 'Agency' };
  const plan = session.metadata?.plan;
  if (!plans[plan] || subscription.metadata?.plan !== plan) return { state: 'unavailable' };
  return { state: 'confirmed', plan: plans[plan] };
}
