import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { recordAgreementPayment } from '../../lib/recordAgreementPayment';
import { reconcileSubscriptionEvent } from '../../lib/server/subscriptionLifecycle';

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
    console.warn('stripe_webhook_signature_invalid');
    return new NextResponse('Invalid webhook signature', { status: 400 });
  }

  if (event.livemode !== process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_')) {
    return NextResponse.json({ error: 'Webhook environment mismatch' }, { status: 400 });
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
    } catch (err: any) {
      console.warn('agreement_payment_webhook_failed');
      return NextResponse.json({ error: 'Payment confirmation unavailable' }, { status: 500 });
    }
  }

  try {
    await reconcileSubscriptionEvent(event, stripe, supabaseAdmin);
  } catch {
    console.warn('subscription_webhook_reconciliation_failed');
    return NextResponse.json({ error: 'Billing confirmation unavailable; provider retry required' }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
