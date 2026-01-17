import { NextResponse } from 'next/server';
import slugify from 'slugify';
import { cookies } from 'next/headers';
// ✅ FIX 1: Use the relative path we know works
// ✅ FIX 2: Use "createClient" (because that is what we named the export in supabaseServer.ts)
import { createClient } from '../../supabaseServer';

export async function POST(req: Request) {
  try {
    const supabase = createClient();

    // ✅ Get logged-in user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (!user || userError) {
      return NextResponse.json(
        { error: 'Not authenticated. Please log in first.' },
        { status: 401 }
      );
    }

    const body = await req.json();

    const slug =
      slugify(body.client_name || 'client', { lower: true }) +
      '-' +
      Math.random().toString(36).substring(2, 6);

    const cleanedMilestones = Array.isArray(body.milestones)
      ? body.milestones
          .filter((m: any) => m.due_date || m.amount)
          .map((m: any) => ({
            due_date: m.due_date || '',
            amount: parseFloat(m.amount || '0') || 0,
            status: m.status || 'due',
          }))
      : [];

    const payload = {
      user_id: user.id, // ⭐ THE BIG CHANGE: Linking the user!
      client_name: body.client_name || '',
      project_scope: body.project_scope || '',
      timeline: body.timeline || '',
      total_amount: parseFloat(body.total_amount || '0') || 0,
      currency: body.currency || 'USD',
      email: body.email || '',
      milestones: cleanedMilestones,
      slug,
    };

    const { data, error } = await supabase
      .from('sow_documents')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('❌ Insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ slug: data.slug }, { status: 200 });
  } catch (err: any) {
    console.error('❌ Server error:', err);
    return NextResponse.json(
      { error: 'Unexpected server error' },
      { status: 500 }
    );
  }
}