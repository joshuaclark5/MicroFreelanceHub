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

    // 3. Calculate Fees (1% Platform Fee)
    // Stripe expects amounts in Cents (e.g., $100.00 = 10000)
    const priceInCents = Math.round(sow.price * 100);
    const platformFee = Math.round(priceInCents * 0.01); 

    // 4. Create the Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { 
            name: `Contract: ${sow.title}`,
            description: `Payment for ${sow.client_name}`
          },
          unit_amount: priceInCents,
        },
        quantity: 1,
      }],
      payment_intent_data: {
        application_fee_amount: platformFee, // <--- THIS IS YOUR CUT 💰
        transfer_data: {
          destination: profile.stripe_account_id, // <--- THIS GOES TO FREELANCER
        },
      },
      // Redirects
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/sow/${sowId}?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/sow/${sowId}?payment=cancelled`,
    });

    return NextResponse.json({ url: session.url });

  } catch (err: any) {
    console.error('Checkout Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}