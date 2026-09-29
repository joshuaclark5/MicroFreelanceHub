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

const PLAN_PRICES = {
  starter: {
    name: 'Starter',
    amount: 900, // $9.00 in cents
    interval: 'month' as const,
  },
  pro: {
    name: 'Professional',
    amount: 2900, // $29.00 in cents
    interval: 'month' as const,
  },
  agency: {
    name: 'Agency',
    amount: 7900, // $79.00 in cents
    interval: 'month' as const,
  },
};

export async function POST(request: Request) {
  try {
    const auth = createRouteHandlerClient({ cookies });
    const { data: { user: authenticatedUser } } = await auth.auth.getUser();
    if (!authenticatedUser) return NextResponse.json({ error: 'Sign in to choose a plan.' }, { status: 401 });
    const { plan, userId, landingPage, leadSource } = await request.json();
    if (userId !== authenticatedUser.id) return NextResponse.json({ error: 'Account mismatch.' }, { status: 403 });

    // Validate plan
    if (typeof plan !== 'string' || !Object.prototype.hasOwnProperty.call(PLAN_PRICES, plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

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

    const planConfig = PLAN_PRICES[plan as keyof typeof PLAN_PRICES];

    // Create checkout session for subscription
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      allow_promotion_codes: true,
      client_reference_id: userId, // Pass userId so webhook can identify the user
      metadata: {
        plan,
        landing_page: attributedLanding,
        lead_source: attributedSource,
      },
      subscription_data: {
        metadata: {
          plan,
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
              description: `${planConfig.name} plan - $${planConfig.amount / 100}/month`,
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
