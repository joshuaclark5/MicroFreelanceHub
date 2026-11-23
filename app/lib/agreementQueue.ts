import { ownedAgreements, projectNextAction } from './projectOverview';

// Only saved owner records drive this queue; editable status is not a payment receipt.
export function agreementQueue(records: any[], ownerId: string) {
  const seen = new Set<string>();
  return ownedAgreements(records, ownerId).flatMap(document => {
    if (typeof document.id !== 'string' || !document.id.trim() || seen.has(document.id)) return [];
    seen.add(document.id);
    const action = projectNextAction(document);
    const rank = action.label === 'Review draft' ? 0 : action.label === 'Review signatures' ? 1 : action.label === 'Review client approval' ? 2 : action.label === 'Review payment details' ? 3 : 4;
    if (rank === 4) return [];
    return [{ id: document.id, client: typeof document.client_name === 'string' && document.client_name.trim() ? document.client_name.trim() : 'Client not set', action, rank }];
  }).sort((a, b) => a.rank - b.rank || a.id.localeCompare(b.id));
}
