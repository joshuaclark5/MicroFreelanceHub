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

// Get the Webhook Secret from Vercel env vars
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature')!;

  let event: Stripe.Event;

  // 1. Verify the event came from Stripe
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Webhook Error: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // 2. Handle the "Payment Successful" event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Get the User ID we sent from the client
    const userId = session.client_reference_id;
    const subscriptionId = session.subscription as string;
    const customerId = session.customer as string;
    const customerEmail = session.customer_details?.email;

    if (userId) {
        // ✅ BEST CASE: We have the exact User ID
        console.log(`💰 Payment success for User: ${userId}`);
        
        const { error } = await supabaseAdmin
           .from('profiles')
           .update({ 
               is_pro: true,
               stripe_customer_id: customerId,  // Save this for cancellations
               subscription_id: subscriptionId  // Save this for tracking
           })
           .eq('id', userId);
           
        if (error) console.error('Error updating profile by ID:', error);
        else console.log(`✅ Upgraded user ${userId} to PRO`);
        
    } else if (customerEmail) {
        // ⚠️ FALLBACK: Use email if ID is missing
        console.log(`💰 Payment with Email (No ID): ${customerEmail}`);
        const { data } = await supabaseAdmin.auth.admin.listUsers();
        const users = data?.users || []; 
        const user = users.find(u => u.email === customerEmail);

        if (user) {
            const { error } = await supabaseAdmin
            .from('profiles')
            .update({ 
                is_pro: true,
                stripe_customer_id: customerId,
                subscription_id: subscriptionId
            })
            .eq('id', user.id);

            if (error) console.error('Error updating profile by Email:', error);
            else console.log(`✅ Upgraded user ${user.id} to PRO (via Email)`);
        } else {
            console.error('User not found for email:', customerEmail);
        }
    }
  }

  return NextResponse.json({ received: true });
}