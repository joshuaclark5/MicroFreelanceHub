export function agreementBalance(document: any) {
  const total = Math.round(Number(document.price) * 100);
  const received = Number(document.payment_received_cents ?? 0);
  if (!Number.isSafeInteger(total) || total <= 0 || !Number.isSafeInteger(received) || received < 0) {
    throw new Error('Invalid agreement payment amounts');
  }
  const remaining = document.status === 'Paid' ? 0 : Math.max(0, total - received);
  const schedule = document.payment_schedule_structured || {};
  let installment = remaining;
  if (schedule.type === 'split' || (received === 0 && ['50', 'fixed'].includes(schedule.type))) {
    installment = Math.round(Number(schedule.depositAmount) * 100);
    if (!Number.isSafeInteger(installment) || installment <= 0 || installment > total) {
      throw new Error('Invalid agreement payment schedule');
    }
  }
  return { total, received, remaining, due: Math.min(installment, remaining) };
}

export function validateAgreementReceipt(session: any, document: any) {
  const metadata = session.metadata || {};
  if (metadata.purpose !== 'agreement_payment' || metadata.sow_id !== document.id ||
      metadata.owner_id !== document.user_id || session.client_reference_id !== document.id) {
    throw new Error('Payment does not belong to this agreement');
  }
  if (session.status !== 'complete' || session.payment_status !== 'paid') throw new Error('Payment is not confirmed');
  const amount = Number(metadata.expected_amount_cents);
  if (session.currency !== 'usd' || !Number.isSafeInteger(amount) || amount <= 0 || session.amount_total !== amount) {
    throw new Error('Payment amount or currency does not match');
  }
  return amount;
}
