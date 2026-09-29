import { validateAgreementReceipt } from './agreementPayment';

// Called only with a Stripe-retrieved session or a verified Stripe webhook event.
export async function recordAgreementPayment(database: any, session: any, document: any) {
  const amount = validateAgreementReceipt(session, document);
  const { error } = await database.rpc('record_agreement_payment', {
    p_sow_id: document.id,
    p_session_id: session.id,
    p_amount_cents: amount,
    p_currency: session.currency,
  });
  if (error) throw new Error('Payment confirmation could not be recorded');
}
