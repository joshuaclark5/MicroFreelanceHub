import 'server-only';
import type Stripe from 'stripe';

// The profile is only a locator: own-row profile updates are not billing authority.
// Missing legacy metadata must be reconciled by an independently audited migration,
// never claimed using an email match or rewritten by a customer-facing request.
export async function ownedStripeCustomer(
  stripe: Pick<Stripe, 'customers'>,
  customerId: unknown,
  userId: string,
): Promise<Stripe.Customer | null> {
  if (!userId || typeof customerId !== 'string' || !/^cus_[a-zA-Z0-9_]{1,240}$/.test(customerId)) return null;
  // Provider failures propagate so callers fail closed without a replacement customer.
  const customer = await stripe.customers.retrieve(customerId);
  if (!customer || customer.deleted || customer.id !== customerId ||
      !('metadata' in customer) || customer.metadata?.supabase_id !== userId) return null;
  return customer;
}
