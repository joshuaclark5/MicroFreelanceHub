import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import Stripe from 'stripe';
import { billingLiveMode, verifiedBilling } from '../../../lib/server/billingStatus';

export const dynamic = 'force-dynamic';
const privateHeaders = { 'Cache-Control': 'private, no-store' };

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ error: 'Sign in required' }, { status: 401, headers: privateHeaders });
    const { data: profile, error: profileError } = await supabase.from('profiles').select('stripe_customer_id,subscription_id').eq('id', user.id).maybeSingle();
    if (profileError) throw new Error('Profile unavailable');
    const key = process.env.STRIPE_SECRET_KEY;
    const state = await verifiedBilling(profile?.stripe_customer_id ? new Stripe(key!) : null, profile, user.id, profile?.stripe_customer_id ? billingLiveMode(key) : true);
    return NextResponse.json(state, { headers: privateHeaders });
  } catch {
    console.warn('billing_status_verification_unavailable');
    return NextResponse.json({ error: 'Unable to load billing details. Please try again.' }, { status: 502, headers: privateHeaders });
  }
}
