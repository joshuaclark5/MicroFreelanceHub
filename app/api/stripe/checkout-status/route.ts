import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import Stripe from 'stripe';
import { subscriptionReceipt } from '../../../lib/subscriptionReceipt';
import { ownedStripeCustomer } from '../../../lib/stripeCustomerOwnership';
export const dynamic = 'force-dynamic';
const reply = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } });
export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return reply({ state: 'signin' }, 401);
    const sessionId = new URL(request.url).searchParams.get('session_id');
    if (!sessionId || !/^cs_[a-zA-Z0-9_]{1,240}$/.test(sessionId)) return reply({ state: 'unavailable' }, 400);
    const { data: profile, error: profileError } = await supabase.from('profiles')
      .select('stripe_customer_id, subscription_id, is_pro').eq('id', user.id).maybeSingle();
    if (profileError) throw profileError;
    if (!profile?.stripe_customer_id) return reply({ state: 'unavailable' });
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    // Never retrieve or disclose another customer's subscription.
    if (session.client_reference_id !== user.id || session.customer !== profile.stripe_customer_id ||
        session.mode !== 'subscription' || typeof session.customer !== 'string' || typeof session.subscription !== 'string') return reply({ state: 'unavailable' });
    // Profile billing columns are user-modifiable in the source schema. Verify the
    // Stripe customer independently, not just metadata copied by checkout creation.
    const customer = await ownedStripeCustomer(stripe, session.customer, user.id);
    if (!customer) return reply({ state: 'unavailable' });
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    return reply(subscriptionReceipt(session, subscription, profile, user.id, customer));
  } catch {
    return reply({ state: 'unavailable' }, 502);
  }
}
