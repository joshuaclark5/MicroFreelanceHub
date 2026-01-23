import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// 🔐 Initialize Supabase with the ADMIN Key (Service Role)
// This key bypasses RLS security rules so we can force the update.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, 
  { auth: { persistSession: false } }
);

export async function POST(request: Request) {
  try {
    const { sowId } = await request.json();

    if (!sowId) {
      return NextResponse.json({ error: "No SOW ID provided" }, { status: 400 });
    }

    // Force update the status to Paid
    const { error } = await supabaseAdmin
      .from('sow_documents')
      .update({ status: 'Paid' })
      .eq('id', sowId);

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Update Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}