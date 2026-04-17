import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const plan = requestUrl.searchParams.get('plan');
  const template = requestUrl.searchParams.get('template');

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    await supabase.auth.exchangeCodeForSession(code);
  }

  // If plan is present, redirect to checkout instead of dashboard
  if (plan) {
    return NextResponse.redirect(new URL(`/checkout-plan?plan=${plan}`, request.url));
  }

  // Otherwise redirect to dashboard (template handling happens there)
  return NextResponse.redirect(new URL('/dashboard', request.url));
}