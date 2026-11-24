import { activeSeasonalOffer } from '../../../lib/seasonalOffers';
import { seasonalCoupon } from '../../../lib/server/seasonalCoupon';
import { PLAN_PRICES, PRICING_VERSION, planQuote, BillingCycle } from '../../../lib/planPricing';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { persistFirstTouch, sanitizeAttribution } from '../../../lib/profileAttribution';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as any,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const auth = createRouteHandlerClient({ cookies });
    const { data: { user: authenticatedUser } } = await auth.auth.getUser();
    if (!authenticatedUser) return NextResponse.json({ error: 'Sign in to choose a plan.' }, { status: 401 });
    const { plan, userId, landingPage, leadSource, billingCycle = 'monthly', pricingVersion, offerId = null } = await request.json();
    if (userId !== authenticatedUser.id) return NextResponse.json({ error: 'Account mismatch.' }, { status: 403 });

    // Validate plan
    if (typeof plan !== 'string' || !Object.prototype.hasOwnProperty.call(PLAN_PRICES, plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    if (!['monthly','annual'].includes(billingCycle)) return NextResponse.json({ error: 'Invalid billing cycle.' }, { status: 400 });
    if (pricingVersion !== PRICING_VERSION) return NextResponse.json({ error: 'Pricing has changed. Refresh pricing and review the current amount before checkout.' }, { status: 409 });

    const now = Date.now();
    const offer = offerId === null ? null : activeSeasonalOffer(now);
    if (offerId !== null && (!offer || offer.id !== offerId || billingCycle !== 'annual')) return NextResponse.json({ error: 'This offer is unavailable. Reload to review the current price.' }, { status: 409 });

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get user's email from Supabase
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await persistFirstTouch(supabase, user, landingPage, leadSource);

    // Read the persisted first touch rather than replacing it with checkout input.
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      throw new Error('Unable to load checkout profile');
    }

    // Never create a second subscription or change an existing subscriber's price here.
    if (profile?.stripe_customer_id) {
      const existing = await stripe.subscriptions.list({ customer: profile.stripe_customer_id, status: 'all', limit: 100 });
      if (offer && existing.data.length > 0) return NextResponse.json({ error: 'This offer is for first-time paid subscribers only. Choose regular pricing to continue.' }, { status: 409 });
      if (existing.has_more || existing.data.some(s => !['canceled','incomplete_expired'].includes(s.status))) {
        return NextResponse.json({ error: 'You already have a subscription. Manage it in Settings; your current price has not changed.' }, { status: 409 });
      }
    }

    const attribution = sanitizeAttribution(profile?.signup_landing_page, profile?.lead_source);
    const attributedLanding = attribution.signup_landing_page || '';
    const attributedSource = attribution.lead_source || '';

    let stripeCustomerId = profile?.stripe_customer_id;

    if (!stripeCustomerId) {
      // Create a new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_id: userId,
        },
      });
      stripeCustomerId = customer.id;

      // Save the Stripe customer ID
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: user.email,
          stripe_customer_id: stripeCustomerId,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });

      if (updateError) {
        throw new Error('Unable to save checkout customer');
      }
    }

    const planConfig = planQuote(plan as keyof typeof PLAN_PRICES, billingCycle as BillingCycle);

    if (offer && profile?.subscription_id) return NextResponse.json({ error: 'This offer is for first-time paid subscribers only. Choose regular pricing to continue.' }, { status: 409 });
    const coupon = offer ? await seasonalCoupon(stripe, offer) : null;

    // Create checkout session for subscription
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      ...(coupon ? { discounts: [{ coupon }], expires_at: Math.floor(now / 1000) + 3600 } : { allow_promotion_codes: true }),
      client_reference_id: userId, // Pass userId so webhook can identify the user
      metadata: {
        plan,
        billing_cycle: billingCycle,
        pricing_version: PRICING_VERSION,
        seasonal_offer: offer?.id || '',
        landing_page: attributedLanding,
        lead_source: attributedSource,
      },
      subscription_data: {
        metadata: {
          plan,
        billing_cycle: billingCycle,
        pricing_version: PRICING_VERSION,
        seasonal_offer: offer?.id || '',
          userId,
          landing_page: attributedLanding,
          lead_source: attributedSource,
        },
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: planConfig.name,
              description: `${planConfig.name} plan - $${planConfig.amount / 100}/${planConfig.interval}`,
            },
            unit_amount: planConfig.amount,
            recurring: {
              interval: planConfig.interval,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-success?plan=${plan}&session_id={CHECKOUT_SESSION_ID}&landing_page=${encodeURIComponent(attributedLanding)}&lead_source=${encodeURIComponent(attributedSource)}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing?upgrade=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Plan Checkout Error:', err);
    return NextResponse.json({ error: 'Unable to start checkout. Please try again.' }, { status: 500 });
  }
}
