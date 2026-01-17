// File: app/auth/callback/route.ts

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '../../supabaseServer';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createServerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL('/', request.url));
}
