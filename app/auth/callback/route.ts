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

  // Rule 3: Check if user is brand new or returning, route accordingly
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const { data: { user } } = await supabase.auth.getUser();

  if (user?.created_at) {
    const userCreatedAt = new Date(user.created_at);
    const now = new Date();
    const secondsSinceCreation = (now.getTime() - userCreatedAt.getTime()) / 1000;

    // Brand new user (created within last 60 seconds) -> go to onboarding
    if (secondsSinceCreation < 60) {
      return NextResponse.redirect(new URL('/create', request.url));
    }

    // Existing user (created more than 60 seconds ago) -> go to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Fallback: default to dashboard
  return NextResponse.redirect(new URL('/dashboard', request.url));
}