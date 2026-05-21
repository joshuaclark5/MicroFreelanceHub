import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const plan = requestUrl.searchParams.get('plan');
  const template = requestUrl.searchParams.get('template');

  // Exchange auth code for session
  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Rule 1: Paywall Flow - Plan selection takes priority
  if (plan === 'pro' || plan === 'agency') {
    return NextResponse.redirect(new URL(`/checkout-plan?plan=${plan}`, request.url));
  }

  // Rule 2: SEO Template Flow - Template preservation is second priority
  if (template) {
    return NextResponse.redirect(new URL(`/templates/${template}`, request.url));
  }

  // Rule 3: Check database state for onboarding completion
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Check if user has completed onboarding from DATABASE
  const { data: profile } = await supabase
    .from('profiles')
    .select('has_completed_onboarding')
    .eq('id', user.id)
    .single();

  // User hasn't completed onboarding → show onboarding flow
  if (profile && !profile.has_completed_onboarding) {
    return NextResponse.redirect(new URL('/create', request.url));
  }

  // User has completed onboarding → go to dashboard
  return NextResponse.redirect(new URL('/dashboard', request.url));
}