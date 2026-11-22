import { agreementBalance } from './agreementPayment';
export function ownedAgreements(records: any[], ownerId: string) {
  return ownerId ? records.filter(record => record?.user_id === ownerId) : [];
}
// Group only exact recorded names. These are agreement groups, not verified client identities.
export function clientGroup(document: any): string {
  return typeof document.client_name === 'string' && document.client_name.trim() ? document.client_name.trim() : 'Client not set';
}
export function projectNextAction(document: any) {
  const id = encodeURIComponent(document.id);
  if (!document.status || document.status === 'Draft') return { label: 'Review draft', detail: 'Review scope and terms before sharing.', href: '/edit/' + id };
  if (!document.provider_sign) return { label: 'Review signatures', detail: 'Your signature is not recorded yet.', href: '/sow/' + id };
  if (!document.signed_by) return { label: 'Review client approval', detail: 'Client signature is not recorded yet.', href: '/sow/' + id };
  if (document.payment_type === 'none') return { label: 'Review signed agreement', detail: 'No online payment is requested.', href: '/sow/' + id };
  try {
    // A legacy editable status must never manufacture a paid balance here.
    const balance = agreementBalance({ ...document, status: undefined });
    if (balance.remaining > 0) return { label: 'Review payment details', detail: balance.received > 0 ? 'A partial payment is recorded. Review the remaining balance.' : 'Review the payment request and current status.', href: '/sow/' + id };
    return { label: 'Review payment record', detail: 'Check the agreement for confirmed payment details.', href: '/sow/' + id };
  } catch {
    return { label: 'Review payment details', detail: 'Payment amounts need review; no balance is assumed.', href: '/sow/' + id };
  }
}
