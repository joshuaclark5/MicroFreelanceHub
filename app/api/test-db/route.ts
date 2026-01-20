import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// This forces the page to run fresh every time (no caching)
export const dynamic = 'force-dynamic';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // We try to grab the secret key
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Check 1: Do the keys even exist in Vercel?
  if (!url || !key) {
    return NextResponse.json({ 
      status: '❌ CONFIG ERROR', 
      message: 'One of the keys is missing from Vercel Settings.',
      has_url: !!url, 
      has_service_key: !!key 
    });
  }

  // Check 2: Try to fetch the data
  const supabase = createClient(url, key);

  const { data, error } = await supabase
    .from('sow_documents')
    .select('slug')
    .not('slug', 'is', null);

  if (error) {
    return NextResponse.json({ 
      status: '❌ DATABASE ERROR', 
      message: error.message,
      hint: 'Your Service Key might be invalid or copied wrong.'
    });
  }

  return NextResponse.json({
    status: '✅ SUCCESS',
    message: 'Connection worked!',
    rows_found: data?.length || 0,
    first_slug_found: data?.[0]?.slug || 'None',
    key_used_starts_with: key.slice(0, 5) + '...' // Verify it's not the "anon" key
  });
}