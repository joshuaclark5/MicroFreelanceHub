export const DRAFT_KEY = 'mfh-editor-draft-v1';
export type EditorDraft = {
  formData: { clientName: string; clientEmail: string; projectTitle: string; taxRate: string; deliverables: string; description: string; dueDate: string };
  lineItems: { id: string; description: string; quantity: number; amount: number }[];
  manualPriceOverride: string;
  includeFee: boolean;
  depositType: 'none' | '50' | 'fixed';
  fixedDepositAmount: string;
  paymentTerms: 'immediate' | 'completion' | 'net15' | 'net30' | 'net60';
  isSplit: boolean;
  splitCount: string;
  splitFrequency: string;
  paymentType: 'one_time' | 'monthly' | 'none';
  dunningEnabled: boolean;
};

export function parseEditorDraft(raw: string | null, now = Date.now()): EditorDraft | null {
  try {
    const envelope = JSON.parse(raw || 'null');
    if (!envelope || envelope.version !== 1 || !Number.isFinite(envelope.savedAt) ||
        now - envelope.savedAt < 0 || now - envelope.savedAt > 86400000) return null;
    const draft = envelope.draft;
    if (!draft || !draft.formData ||
        !['clientName', 'clientEmail', 'projectTitle', 'taxRate', 'deliverables', 'description', 'dueDate'].every(key => typeof draft.formData[key] === 'string' && draft.formData[key].length <= 100000) ||
        !['manualPriceOverride', 'fixedDepositAmount', 'splitCount', 'splitFrequency'].every(key => typeof draft[key] === 'string' && draft[key].length <= 30) ||
        !['includeFee', 'isSplit', 'dunningEnabled'].every(key => typeof draft[key] === 'boolean') ||
        !['none', '50', 'fixed'].includes(draft.depositType) ||
        !['immediate', 'completion', 'net15', 'net30', 'net60'].includes(draft.paymentTerms) ||
        !['one_time', 'monthly', 'none'].includes(draft.paymentType) ||
        !Array.isArray(draft.lineItems) || draft.lineItems.length > 500 ||
        !draft.lineItems.every((item: any) => item && typeof item.id === 'string' && typeof item.description === 'string' && Number.isFinite(item.quantity) && Number.isFinite(item.amount))) return null;
    return draft as EditorDraft;
  } catch { return null; }
}
