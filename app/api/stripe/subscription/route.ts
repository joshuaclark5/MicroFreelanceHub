import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function GET() {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  try {
    const { data: profile, error: profileError } = await supabase.from('profiles')
      .select('stripe_customer_id').eq('id', user.id).maybeSingle();
    if (profileError) throw profileError;
    const free = { plan: 'Free', status: 'No subscription', cycle: 'None', nextDate: null, cancelAtPeriodEnd: false, canCancel: false, canManage: !!profile?.stripe_customer_id };
    if (!profile?.stripe_customer_id) return NextResponse.json(free);

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const subscriptions = await stripe.subscriptions.list({ customer: profile.stripe_customer_id, status: 'all', limit: 100, expand: ['data.items.data.price.product'] });
    const subscription = subscriptions.data.find(s => !['canceled', 'incomplete_expired'].includes(s.status));
    if (!subscription) return NextResponse.json(free);
    const item = subscription.items.data[0];
    const product = item?.price.product;
    const name = typeof product === 'object' && !('deleted' in product && product.deleted) ? (product as Stripe.Product).name : null;
    const recurring = item?.price.recurring;
    const nextDate = subscription.cancel_at || item?.current_period_end;
    return NextResponse.json({
      plan: name || subscription.metadata.plan || 'Paid subscription',
      status: subscription.status.replace(/_/g, ' '),
      cycle: recurring ? `${recurring.interval_count} ${recurring.interval}${recurring.interval_count > 1 ? 's' : ''}` : 'Unavailable',
      nextDate: nextDate ? new Date(nextDate * 1000).toISOString() : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end || !!subscription.cancel_at,
      canManage: true,
      canCancel: !subscription.cancel_at_period_end && !subscription.cancel_at,
    });
  } catch {
    return NextResponse.json({ error: 'Unable to load billing details. Please try again.' }, { status: 502 });
  }
}
