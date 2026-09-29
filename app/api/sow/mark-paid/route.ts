import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { recordAgreementPayment } from '../../../lib/recordAgreementPayment';

const database = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' as any });

export async function POST(request: Request) {
  try {
    const { sowId, sessionId } = await request.json();
    if (typeof sowId !== 'string' || typeof sessionId !== 'string' || !sessionId.startsWith('cs_')) {
      return NextResponse.json({ error: 'A Stripe confirmation is required.' }, { status: 400 });
    }
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const { data: document, error } = await database.from('sow_documents').select('*').eq('id', sowId).single();
    if (error || !document) return NextResponse.json({ error: 'Agreement not found.' }, { status: 404 });
    await recordAgreementPayment(database, session, document);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Payment has not been verified. Please refresh shortly or contact support.' }, { status: 409 });
  }
}
