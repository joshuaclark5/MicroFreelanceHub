import type { EditorDraft } from './agreementDraft';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function createChangeOrderDraft(original: any, input: { scope: string; amount: string; timeline: string }): EditorDraft {
  const amount = Number(input.amount);
  if (!uuid.test(original?.id || '') || !input.scope.trim() || input.scope.length > 12000 ||
      !input.amount.trim() || !Number.isFinite(amount) || amount < 0 || !Number.isSafeInteger(Math.round(amount * 100)) ||
      !input.timeline.trim() || input.timeline.length > 1000) throw new Error('Enter the added scope, a valid nonnegative amount, and the timeline impact.');
  const originalTotal = Number(original.price);
  if (!Number.isFinite(originalTotal) || originalTotal < 0) throw new Error('The original agreement total is unavailable. Review it before creating an addition.');
  const title = String(original.title || 'Project').slice(0, 160);
  const text = [
    'CHANGE ORDER / SEPARATE AGREEMENT',
    'Original agreement ID: ' + original.id,
    'Original project: ' + title,
    'Original agreed amount (reference only): USD ' + originalTotal.toFixed(2),
    '',
    'ADDITIONAL SCOPE',
    input.scope.trim(),
    '',
    'TIMELINE IMPACT',
    input.timeline.trim(),
    '',
    'PAYMENT FOR THIS ADDITION',
    'Review the payment terms and final totals for this addition before signing.',
    '',
    '1. PAYMENT TERMS',
    'Full payment of $' + amount.toFixed(2) + ' is required. Terms: Due upon receipt.',
    '',
    '2. OWNERSHIP & RIGHTS',
    'Review the original agreement terms for this addition. Write any exceptions into this change order before signing.',
    '',
    'This document covers only the added work described above. Creating or signing it does not revise the original agreement or record payment. Review both documents together. Any other changes should be expressly agreed by both parties.',
  ].join('\n');
  return {
    formData: { clientName: original.client_name || '', clientEmail: original.client_data?.email || '', projectTitle: 'Change order: ' + title, taxRate: '', deliverables: text, description: input.scope.trim(), dueDate: '' },
    lineItems: [{ id: 'additional-work', description: input.scope.trim().slice(0, 160), quantity: 1, amount }],
    manualPriceOverride: '', includeFee: false, depositType: 'none', fixedDepositAmount: '',
    paymentTerms: 'immediate', isSplit: false, splitCount: '2', splitFrequency: '30', paymentType: 'one_time', dunningEnabled: false,
  };
}

// Presentation only: this text reference grants no permissions and changes no payment state.
export function changeOrderReference(document: any): { originalId: string; scope: string; timeline: string } | null {
  if (!String(document?.title || '').startsWith('Change order: ')) return null;
  const text = String(document?.deliverables || '');
  const id = text.match(/^Original agreement ID: ([0-9a-f-]+)$/im)?.[1];
  if (!id || !uuid.test(id)) return null;
  const scope = text.split('\nADDITIONAL SCOPE\n')[1]?.split('\n\nTIMELINE IMPACT\n')[0]?.trim();
  const timeline = text.split('\nTIMELINE IMPACT\n')[1]?.split('\n\nPAYMENT FOR THIS ADDITION\n')[0]?.trim();
  return scope && timeline ? { originalId: id, scope, timeline } : null;
}
