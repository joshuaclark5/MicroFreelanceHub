import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

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
    const { plan, userId, landingPage, leadSource } = await request.json();

    // Validate plan
    if (!plan || !PLAN_PRICES[plan as keyof typeof PLAN_PRICES]) {
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

    // Get user's Stripe customer ID or create one
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      console.error('Error loading profile for checkout:', profileError);
    }

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
          signup_landing_page: landingPage || null,
          lead_source: leadSource || null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });

      if (updateError) {
        console.error('Error saving Stripe customer ID:', updateError);
      }
    }

    const planConfig = PLAN_PRICES[plan as keyof typeof PLAN_PRICES];

    // Create checkout session for subscription
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      client_reference_id: userId, // Pass userId so webhook can identify the user
      metadata: {
        plan,
        landing_page: landingPage || '',
        lead_source: leadSource || '',
      },
      subscription_data: {
        metadata: {
          plan,
          userId,
          landing_page: landingPage || '',
          lead_source: leadSource || '',
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
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-success?plan=${plan}&session_id={CHECKOUT_SESSION_ID}&landing_page=${encodeURIComponent(landingPage || '')}&lead_source=${encodeURIComponent(leadSource || '')}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing?upgrade=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Plan Checkout Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
