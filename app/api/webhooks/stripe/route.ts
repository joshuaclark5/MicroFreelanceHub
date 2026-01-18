import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as any,
});

// Initialize Supabase Admin
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Webhook Error: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    // 1. Get the user's email from Stripe
    const customerEmail = session.customer_details?.email;
    
    if (customerEmail) {
      console.log(`💰 Payment received from: ${customerEmail}`);

      // 2. Find the user in Supabase by email
      // FIX: We separate the data check to keep TypeScript happy
      const { data, error: userError } = await supabaseAdmin.auth.admin.listUsers();
      
      // Safe check: If data or users is missing, default to empty array
      const users = data?.users || []; 

      const user = users.find(u => u.email === customerEmail);

      if (user) {
         // 3. Mark them as PRO
         const { error } = await supabaseAdmin
           .from('profiles')
           .update({ is_pro: true })
           .eq('id', user.id);
           
         if (error) console.error('Error updating profile:', error);
         else console.log(`✅ Upgraded user ${user.id} to PRO`);
      } else {
        console.error('User not found for email:', customerEmail);
      }
    }
  }

  return NextResponse.json({ received: true });
}