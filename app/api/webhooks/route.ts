import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { recordAgreementPayment } from '../../lib/recordAgreementPayment';

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

  // Fetch current provider state so delayed/replayed lifecycle events cannot
  // restore access from an old trial or remove access from a newer subscription.
  if (['customer.subscription.updated', 'customer.subscription.deleted'].includes(event.type)) {
    try {
      const eventSubscription = event.data.object as Stripe.Subscription;
      const current = await stripe.subscriptions.retrieve(eventSubscription.id);
      const customerId = typeof current.customer === 'string' ? current.customer : current.customer.id;
      const { error } = await supabaseAdmin.from('profiles').update({
        is_pro: ['active', 'trialing'].includes(current.status),
        updated_at: new Date().toISOString(),
      }).eq('stripe_customer_id', customerId).eq('subscription_id', current.id);
      if (error) throw error;
      return NextResponse.json({ received: true });
    } catch {
      return NextResponse.json({ error: 'Unable to synchronize subscription' }, { status: 500 });
    }
  }

  // 2. Handle checkout.session.completed
  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    try {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.purpose === 'agreement_payment') {
        if (session.payment_status !== 'paid') return NextResponse.json({ received: true });
        const { data: document, error: lookupError } = await supabaseAdmin.from('sow_documents').select('*').eq('id', session.metadata.sow_id).single();
        if (lookupError || !document) return NextResponse.json({ error: 'Agreement lookup failed' }, { status: 500 });
        await recordAgreementPayment(supabaseAdmin, session, document);
        return NextResponse.json({ received: true });
      }
      if (session.mode !== 'subscription' || !session.subscription || !['starter', 'pro', 'agency'].includes(session.metadata?.plan || '')) {
        return NextResponse.json({ received: true });
      }

      // Extract data from session
      const userId = session.client_reference_id;
      const stripeCustomerId = session.customer as string;
      const subscriptionId = session.subscription as string;
      const customerEmail = session.customer_details?.email || null;

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const subscriptionCustomer = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
      if (subscriptionCustomer !== stripeCustomerId || subscription.metadata.userId !== userId || !['active', 'trialing'].includes(subscription.status)) {
        return NextResponse.json({ received: true });
      }
      const { data: existingProfile, error: profileError } = await supabaseAdmin.from('profiles').select('stripe_customer_id,subscription_id').eq('id', userId).maybeSingle();
      if (profileError) throw profileError;
      if (!existingProfile || existingProfile.stripe_customer_id !== stripeCustomerId) return NextResponse.json({ error: 'Customer mapping unavailable' }, { status: 500 });
      if (existingProfile.subscription_id && existingProfile.subscription_id !== subscriptionId) {
        const previous = await stripe.subscriptions.retrieve(existingProfile.subscription_id);
        if (!['canceled', 'incomplete_expired'].includes(previous.status)) return NextResponse.json({ received: true });
      }

      // Validate we have userId
      if (!userId) {
        console.warn('⚠️ Webhook received but no client_reference_id (userId) found');
        return NextResponse.json({ error: 'No user reference' }, { status: 400 });
      }

      console.log(`💰 Processing payment for User: ${userId}, Customer: ${stripeCustomerId}`);

      const profileUpdate: Record<string, string | boolean | null> = {
        id: userId,
        is_pro: true,
        stripe_customer_id: stripeCustomerId,
        subscription_id: subscriptionId,
        updated_at: new Date().toISOString(),
      };

      if (customerEmail) profileUpdate.email = customerEmail;

      // Upsert user's profile with is_pro=true and save Stripe IDs.
      const { error } = await supabaseAdmin
        .from('profiles')
        .upsert(profileUpdate, { onConflict: 'id' });

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
