import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as any,
});

// We need the Service Role Key to look up the freelancer's Stripe ID securely
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { sowId } = await request.json();

    // 1. Get SOW details from Database
    const { data: sow, error: sowError } = await supabase
      .from('sow_documents')
      .select('*')
      .eq('id', sowId)
      .single();

    if (sowError || !sow) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // 2. Get Freelancer's Stripe Connected ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', sow.user_id)
      .single();
    
    // STOP if the freelancer hasn't connected Stripe yet
    if (!profile?.stripe_account_id) {
       return NextResponse.json(
         { error: 'This freelancer has not set up payouts yet.' }, 
         { status: 400 }
       );
    }

    // 3. Determine Mode (Subscription vs One-Time)
    const isSubscription = sow.payment_type === 'monthly';
    const priceInCents = Math.round(sow.price * 100);

    // 4. Construct the Session Config
    let sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { 
            name: isSubscription ? `Retainer: ${sow.title}` : `Contract: ${sow.title}`,
            description: isSubscription ? `Monthly recurring payment for ${sow.client_name}` : `One-time payment for ${sow.client_name}`
          },
          unit_amount: priceInCents,
          // 🔄 THE MAGIC SWITCH: If monthly, add recurring interval
          ...(isSubscription && { recurring: { interval: 'month' } }),
        },
        quantity: 1,
      }],
      // Redirects
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/sow/${sowId}?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/sow/${sowId}?payment=cancelled`,
    };

    // 5. Handle Fees & Transfers (Logic differs for Subscriptions vs Payments)
    if (isSubscription) {
      // 🔄 SUBSCRIPTION MODE
      sessionConfig.mode = 'subscription';
      sessionConfig.subscription_data = {
        application_fee_percent: 1, // You get 1% of every monthly payment automatically 💸
        transfer_data: {
          destination: profile.stripe_account_id,
        },
      };
    } else {
      // 💳 ONE-TIME PAYMENT MODE
      const platformFee = Math.round(priceInCents * 0.01); 
      sessionConfig.mode = 'payment';
      sessionConfig.payment_intent_data = {
        application_fee_amount: platformFee, // You get 1% of the total once
        transfer_data: {
          destination: profile.stripe_account_id,
        },
      };
    }

    // 6. Create the Session
    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({ url: session.url });

  } catch (err: any) {
    console.error('Checkout Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}