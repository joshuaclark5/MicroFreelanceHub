import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as any,
});

// Initialize Supabase Admin (Service Role) - CRITICAL for Webhooks
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Get the Webhook Secret from environment
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature')!;

  let event: Stripe.Event;

  // 1. Verify the event came from Stripe
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Webhook Signature Error: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // 2. Handle checkout.session.completed
  if (event.type === 'checkout.session.completed') {
    try {
      const session = event.data.object as Stripe.Checkout.Session;

      // Extract data from session
      const userId = session.client_reference_id;
      const stripeCustomerId = session.customer as string;
      const subscriptionId = session.subscription as string;

      // Validate we have userId
      if (!userId) {
        console.warn('⚠️ Webhook received but no client_reference_id (userId) found');
        return NextResponse.json({ error: 'No user reference' }, { status: 400 });
      }

      console.log(`💰 Processing payment for User: ${userId}, Customer: ${stripeCustomerId}`);

      // Update user's profile with is_pro=true and save Stripe IDs
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({
          is_pro: true,
          stripe_customer_id: stripeCustomerId,
          subscription_id: subscriptionId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.error(`❌ Error updating profile for user ${userId}:`, error);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }

      console.log(`✅ Successfully upgraded user ${userId} to PRO`);
    } catch (err: any) {
      console.error('❌ Error processing checkout.session.completed:', err);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
