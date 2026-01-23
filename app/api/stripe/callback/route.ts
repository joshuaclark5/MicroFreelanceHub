import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as any, // "as any" fixes strict TS version errors
});

// Initialize Supabase Admin (Required to write to the protected 'profiles' table)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // We passed the User ID here
  const error = searchParams.get('error');

  // 1. Handle "Access Denied" (User clicked Cancel)
  if (error) {
    console.log('User denied Stripe access');
    return NextResponse.redirect(new URL('/dashboard?error=stripe_declined', request.url));
  }

  if (!code || !state) {
    return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
  }

  try {
    // 2. Trade the "Code" for a "Stripe Account ID"
    const response = await stripe.oauth.token({
      grant_type: 'authorization_code',
      code,
    });

    const stripeAccountId = response.stripe_user_id;

    // 3. Save that Account ID to the User's Profile in Supabase
    // This allows us to pay them later!
    const { error: dbError } = await supabase
      .from('profiles')
      .update({ stripe_account_id: stripeAccountId })
      .eq('id', state);

    if (dbError) {
      console.error('Supabase Error:', dbError);
      return NextResponse.redirect(new URL('/dashboard?error=db_save_failed', request.url));
    }

    // 4. Success! Send them back to the dashboard
    return NextResponse.redirect(new URL('/dashboard?success=stripe_connected', request.url));

  } catch (err: any) {
    console.error('Stripe Connection Failed:', err.message);
    return NextResponse.redirect(new URL('/dashboard?error=stripe_connection_failed', request.url));
  }
}