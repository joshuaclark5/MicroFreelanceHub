import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as any,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const auth = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { user }, error: userError } = await auth.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    }

    // Get user's Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'Stripe customer not found. Please upgrade your plan first.' },
        { status: 404 }
      );
    }

    // Create billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/settings`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err: any) {
    console.error('Billing Portal Error:', err);
    return NextResponse.json({ error: 'Unable to open billing portal.' }, { status: 500 });
  }
}
