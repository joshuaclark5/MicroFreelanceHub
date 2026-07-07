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

  // Exchange auth code for session
  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Rule 1: Paywall Flow - Plan selection takes priority
  if (plan === 'starter' || plan === 'pro' || plan === 'agency') {
    return NextResponse.redirect(new URL(`/checkout-plan?plan=${plan}`, request.url));
  }

  // Rule 2: SEO Template Flow - Template preservation is second priority
  if (template) {
    return NextResponse.redirect(new URL(`/templates/${template}`, request.url));
  }

  // Save lead tracking data to profiles table if provided
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

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

  // New users bypass onboarding and go directly to dashboard
  return NextResponse.redirect(new URL('/dashboard', request.url));
}
