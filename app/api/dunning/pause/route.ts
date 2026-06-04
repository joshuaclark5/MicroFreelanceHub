import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { invoice_id } = body;

    if (!invoice_id) {
      return NextResponse.json({ error: 'Missing invoice_id' }, { status: 400 });
    }

    // Verify user owns this invoice by checking if there's a corresponding SOW document
    const { data: sow, error: sowError } = await supabase
      .from('sow_documents')
      .select('id')
      .eq('id', invoice_id)
      .eq('user_id', user.id)
      .single();

    if (sowError || !sow) {
      return NextResponse.json(
        { error: 'Invoice not found or unauthorized' },
        { status: 404 }
      );
    }

    // Update invoice to disable dunning
    const { error: updateError } = await supabase
      .from('invoices')
      .update({ dunning_enabled: false })
      .eq('id', invoice_id);

    if (updateError) {
      console.error('Error updating invoice:', updateError);
      return NextResponse.json(
        { error: 'Failed to pause dunning' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Dunning emails paused' });
  } catch (error) {
    console.error('Pause dunning error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
