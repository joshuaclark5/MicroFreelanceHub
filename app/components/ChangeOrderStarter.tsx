'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DRAFT_KEY, parseEditorDraft } from '../lib/agreementDraft';
import { createChangeOrderDraft } from '../lib/changeOrderDraft';

export default function ChangeOrderStarter({ original }: { original: any }) {
  const router = useRouter();
  const [scope, setScope] = useState('');
  const [amount, setAmount] = useState('');
  const [timeline, setTimeline] = useState('');
  const [error, setError] = useState('');
  return <section className="d4-change-comparison" aria-label="Separate change order">
    <form className="d4-surface" onSubmit={event => {
      event.preventDefault(); setError('');
      try {
        const draft = createChangeOrderDraft(original, { scope, amount, timeline });
        if (parseEditorDraft(sessionStorage.getItem(DRAFT_KEY)) && !confirm('Replace the unsaved editor draft in this tab with this change order? Cancel to keep the current draft.')) return;
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ version: 1, savedAt: Date.now(), draft }));
        // Template selection must not override this deliberate separate-document handoff.
        localStorage.removeItem('pending_template');
        router.push('/create?mode=editor');
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Your change-order draft could not be opened. Keep this page open and try again.');
      }
    }}>
      <p className="d4-eyebrow">Extra work / Separate approval</p>
      <h2 className="mt-3 text-2xl font-semibold">Create a separate change order.</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">Keep the original agreement intact. Describe only the added work, its price and the effect on timing.</p>
      <label className="d4-field">Added scope<textarea required maxLength={12000} rows={3} className="d4-change-input" value={scope} onChange={e => setScope(e.target.value)} placeholder="Add a booking page and connect the supplied scheduling link." /></label>
      <div className="grid grid-cols-2 gap-3"><label className="d4-field">Additional fee (USD)<input required type="number" min="0" step="0.01" className="d4-change-input" value={amount} onChange={e => setAmount(e.target.value)} /></label><label className="d4-field">Timeline impact<input required maxLength={1000} className="d4-change-input" value={timeline} onChange={e => setTimeline(e.target.value)} placeholder="+2 business days" /></label></div>
      {error && <p role="alert" className="d4-recovery mt-4">{error}</p>}
      <button className="d4-primary mt-6" type="submit">Review separate change order</button>
      <p className="mt-3 text-xs leading-5 text-slate-600">Opens a new agreement draft, not an update to this one. Review before saving and sharing. Existing agreement limits and payment eligibility apply.</p>
    </form>
    <aside className="d4-paper-wrap"><div className="d4-paper-caption"><span>Approval request preview</span><span>Not saved</span></div><article className="d4-paper">
      <p className="d4-eyebrow">Original agreement / {original.status || 'Status unavailable'}</p><h2>{original.title}</h2><p>Prepared for {original.client_name || 'your client'}</p>
      <dl className="d4-document-totals"><div><dt>Original agreed total</dt><dd>${Number(original.price || 0).toFixed(2)}</dd></div><div><dt>Additional fee</dt><dd>{amount ? '$' + Number(amount).toFixed(2) : 'Not set'}</dd></div></dl>
      <h3>The addition</h3><p className="whitespace-pre-wrap">{scope || 'Describe the additional work.'}</p><h3>Timeline impact</h3><p>{timeline || 'Describe the change in delivery timing.'}</p>
      <h3>A separate decision</h3><p>The original stays unchanged by this action. Client approval and payment are recorded on the new document, separately.</p>
      <Link className="inline-block mt-5 text-sm text-blue-700 underline" href={`/sow/${original.id}`} target="_blank">Read original agreement (new tab)</Link>
    </article></aside>
  </section>;
}
