import { getAuthDestination } from '../../lib/authDestination';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { persistFirstTouch, requestAttributionOptedOut } from '../../lib/profileAttribution';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const plan = requestUrl.searchParams.get('plan');
  const template = requestUrl.searchParams.get('template');
  const optedOut = requestAttributionOptedOut(request, requestUrl.searchParams.get('attribution_opt_out'));
  const landing_page = optedOut ? null : requestUrl.searchParams.get('landing_page');
  const lead_source = optedOut ? null : requestUrl.searchParams.get('lead_source');
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Exchange auth code for session
  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Save lead tracking data to profiles table if provided
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    if (!optedOut) await persistFirstTouch(supabaseAdmin, user, landing_page, lead_source);
  } catch {
    console.error('Signup attribution could not be persisted');
  }

  const successParams = new URLSearchParams({
    tier: 'free',
  });

  if (optedOut) successParams.set('attribution_opt_out', '1');
  if (template) successParams.set('template', template);
  if (landing_page) successParams.set('landing_page', landing_page);
  if (lead_source) successParams.set('lead_source', lead_source);

  // Rule 1: Paywall Flow - Plan selection takes priority
  if (plan === 'starter' || plan === 'pro' || plan === 'agency') {
    const checkoutParams = new URLSearchParams({ plan, billing: requestUrl.searchParams.get('billing')==='annual'?'annual':'monthly' });
    if (optedOut) checkoutParams.set('attribution_opt_out', '1');
    if (template) checkoutParams.set('template', template);
    if (landing_page) checkoutParams.set('landing_page', landing_page);
    if (lead_source) checkoutParams.set('lead_source', lead_source);
    return NextResponse.redirect(new URL(`/checkout-plan?${checkoutParams.toString()}`, request.url));
  }

  const destination = getAuthDestination(requestUrl.searchParams);
  if (!template && destination) {
    return NextResponse.redirect(new URL(destination, request.url));
  }

  // Free-account conversion page for analytics segmentation.
  return NextResponse.redirect(new URL(`/signup-success?${successParams.toString()}`, request.url));
}
