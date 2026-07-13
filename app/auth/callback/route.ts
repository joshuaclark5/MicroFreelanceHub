import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const plan = requestUrl.searchParams.get('plan');
  const template = requestUrl.searchParams.get('template');
  const landing_page = requestUrl.searchParams.get('landing_page');
  const lead_source = requestUrl.searchParams.get('lead_source');
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // Exchange auth code for session
  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Save lead tracking data to profiles table if provided
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Save lead source tracking to user profile
  if (landing_page || lead_source) {
    await supabase
      .from('profiles')
      .update({
        signup_landing_page: landing_page,
        lead_source: lead_source,
      })
      .eq('id', user.id);
  }

  const successParams = new URLSearchParams({
    tier: 'free',
  });

  if (template) successParams.set('template', template);
  if (landing_page) successParams.set('landing_page', landing_page);
  if (lead_source) successParams.set('lead_source', lead_source);

  // Rule 1: Paywall Flow - Plan selection takes priority
  if (plan === 'starter' || plan === 'pro' || plan === 'agency') {
    const checkoutParams = new URLSearchParams({ plan });
    if (template) checkoutParams.set('template', template);
    if (landing_page) checkoutParams.set('landing_page', landing_page);
    if (lead_source) checkoutParams.set('lead_source', lead_source);
    return NextResponse.redirect(new URL(`/checkout-plan?${checkoutParams.toString()}`, request.url));
  }

  // Free-account conversion page for analytics segmentation.
  return NextResponse.redirect(new URL(`/signup-success?${successParams.toString()}`, request.url));
}
