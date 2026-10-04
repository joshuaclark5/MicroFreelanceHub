'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { keepDialogFocus } from '../lib/dialogFocus';
import { trackAgreementEvent } from '../lib/agreementEvents';

export type AgreementBrief = { title: string; scope: string; timing: string; price: string; client: string; email: string; revisions: string; exclusions: string; deposit: 'none' | '50' };
const empty: AgreementBrief = { title: '', scope: '', timing: '', price: '', client: '', email: '', revisions: '', exclusions: '', deposit: 'none' };
const labels = ['Project', 'Scope', 'Payment', 'Review'];
const money = (value: string) => value ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value)) : 'Not set';

export default function AgreementStarter({ onComplete, onSkip }: {
  onComplete: (brief: AgreementBrief) => void;
  onSkip: (brief: AgreementBrief) => void;
}) {
  const [stage, setStage] = useState(0);
  const [brief, setBrief] = useState<AgreementBrief>(empty);
  const [restored, setRestored] = useState(false);
  const [storageState, setStorageState] = useState('Loading draft…');
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem('mfh-agreement-brief-v1') || 'null');
      if (saved && Number.isFinite(saved.savedAt) && saved.savedAt <= Date.now() && Date.now() - saved.savedAt < 86400000 && ['title', 'scope', 'timing', 'price'].every(key => typeof saved.brief?.[key] === 'string')) {
        const next = { ...empty };
        for (const key of Object.keys(empty) as (keyof AgreementBrief)[]) {
          if (typeof saved.brief[key] === 'string') (next as Record<string, string>)[key] = saved.brief[key].slice(0, key === 'scope' ? 12000 : 1000);
        }
        if (!['none', '50'].includes(next.deposit)) next.deposit = 'none';
        setBrief(next);
        setStage(Number.isInteger(saved.stage) && saved.stage >= 0 && saved.stage <= 3 ? (saved.version === 2 ? saved.stage : Math.min(saved.stage, 1)) : 0);
      }
    } catch { setStorageState('Browser storage unavailable. Keep this page open.'); }
    setRestored(true);
  }, []);
  useEffect(() => {
    if (!restored) return;
    try {
      sessionStorage.setItem('mfh-agreement-brief-v1', JSON.stringify({ version: 2, brief, stage, savedAt: Date.now() }));
      setStorageState('Draft saved in this tab');
    } catch { setStorageState('Not saved — browser storage unavailable. Keep this page open.'); }
  }, [brief, stage, restored]);
  const advance = (next: number) => { setStage(next); requestAnimationFrame(() => heading.current?.focus()); };
  const field = 'mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-600';
  const update = (key: keyof AgreementBrief, value: string) => setBrief(previous => ({ ...previous, [key]: value }));
  const document = <article className="d4-paper">
    <p className="d4-eyebrow">Project agreement · Draft preview</p>
    <h2>{brief.title || 'Your next project'}</h2>
    <p>Prepared for {brief.client || 'your client'}</p>
    <dl className="d4-document-totals"><div><dt>Base project total</dt><dd>{money(brief.price)}</dd></div><div><dt>{brief.deposit === '50' ? 'Initial deposit (50%)' : 'One payment'}</dt><dd>{money(brief.price ? String(Number(brief.price) * (brief.deposit === '50' ? .5 : 1)) : '')}</dd></div></dl>
    <h3>01 / The work</h3><p className="whitespace-pre-wrap">{brief.scope || 'Add the deliverables your client can expect.'}</p>
    {brief.revisions && <p>Included revisions: {brief.revisions}</p>}
    <h3>02 / Timeline</h3><p>{brief.timing || 'Add your target completion or milestones.'}</p>
    <h3>03 / Outside the scope</h3><p className="whitespace-pre-wrap">{brief.exclusions || 'Specify work that needs a separate quote and approval.'}</p>
    <h3>04 / Review before sharing</h3><p>This preview is your project brief. Review the full terms, tax, fees and payment settings in the direct editor before saving a client link.</p>
  </article>;

  return <section className="d4-starter mx-auto max-w-6xl p-5 sm:p-8">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-5">
      <p role="status" className="text-xs text-slate-600">{storageState}</p>
      <button className="d4-secondary" type="button" onClick={() => dialog.current?.showModal()}>Preview</button>
    </div>
    <p className="mt-4 text-sm text-slate-600">Draft and preview before creating an account. Saving requires an account; paid features and account limits are shown before checkout. <a href="/pricing" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">View plans</a></p>
    <ol aria-label="Agreement progress" className="d4-stepbar">
      {labels.map((label, index) => <li key={label} aria-current={stage === index ? 'step' : undefined}><button type="button" disabled={index > stage} onClick={() => advance(index)}>{index + 1} {label}</button></li>)}
    </ol>
    <div className="d4-starter-grid">
      <form onSubmit={event => {
        event.preventDefault();
        if (stage === 0) trackAgreementEvent('agreement_started');
        if (stage === 1) trackAgreementEvent('agreement_scope_completed');
        if (stage === 3) trackAgreementEvent('agreement_editor_opened');
        stage < 3 ? advance(stage + 1) : onComplete(brief);
      }}>
        <fieldset disabled={!restored}>
          <p className="d4-eyebrow mb-4">Guided draft · Step {stage + 1} of 4</p>
          <button type="button" onClick={() => onSkip(brief)} className="mb-3 text-sm text-blue-700 underline underline-offset-4">Prefer writing? Open direct editor</button>
          <h1 ref={heading} tabIndex={-1} className="text-3xl font-semibold text-slate-950">{['What are you working on?', 'Make expectations clear.', 'How will this project be paid?', 'Review your project.'][stage]}</h1>
          <p className="mt-3 text-sm text-slate-600">{['Start with the project and the people involved.', 'A little detail now means fewer questions later.', 'Define payment terms now. Connect Stripe when you want to collect.', 'Check the brief, then review the full agreement before saving.'][stage]}</p>
          {stage === 0 && <>
            <label className="d4-field">Project name<input required maxLength={160} value={brief.title} onChange={e => update('title', e.target.value)} className={field} placeholder="Website redesign" /></label>
            <label className="d4-field">Client name (optional)<input maxLength={160} value={brief.client} onChange={e => update('client', e.target.value)} className={field} /></label>
            <label className="d4-field">Client email (optional)<input type="email" maxLength={254} value={brief.email} onChange={e => update('email', e.target.value)} className={field} /></label>
          </>}
          {stage === 1 && <>
            <label className="d4-field">What will you deliver?<textarea required maxLength={12000} rows={4} value={brief.scope} onChange={e => update('scope', e.target.value)} className={field} placeholder="Five pages, responsive desktop and mobile layouts." /></label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="d4-field">Revision rounds<select value={brief.revisions} onChange={e => update('revisions', e.target.value)} className={field}><option value="">Not specified</option><option>1 round</option><option>2 rounds</option><option>3 rounds</option><option>No revisions</option></select></label>
              <label className="d4-field">Target completion<input maxLength={1000} value={brief.timing} onChange={e => update('timing', e.target.value)} className={field} placeholder="Date or milestone" /></label>
            </div>
            <label className="d4-field">What is not included?<textarea rows={3} maxLength={1000} value={brief.exclusions} onChange={e => update('exclusions', e.target.value)} className={field} placeholder="Copywriting, hosting and additional pages." /></label>
            <p className="text-xs text-slate-600">Keep exclusions specific and easy to understand.</p>
          </>}
          {stage === 2 && <>
            <label className="d4-field">Project price (USD, optional)<input type="number" min="0" step="0.01" value={brief.price} onChange={e => update('price', e.target.value)} className={field} placeholder="2400" /></label>
            <label className="d4-field">Payment schedule<select value={brief.deposit} onChange={e => update('deposit', e.target.value)} className={field}><option value="none">One payment</option><option value="50">50% deposit, 50% balance</option></select></label>
            <div className="d4-recovery mt-6"><h2 className="font-semibold">Draft first. Connect payments when ready.</h2><p className="mt-2 text-sm">This step sets proposed terms, not a payment link. Online collection requires an eligible Stripe connection and plan. No charge is created here.</p><a className="mt-3 inline-block text-sm text-blue-700 underline" href="/settings" target="_blank" rel="noopener noreferrer">Payment setup (opens a new tab)</a></div>
            <p className="mt-5 text-sm text-slate-600">Tax, fees, installments and recurring options remain available in the direct editor. Existing plan limits apply.</p>
          </>}
          {stage === 3 && <div className="mt-6">
            <dl className="d4-review-list"><div><dt>Project / client</dt><dd>{brief.title} / {brief.client || 'Not set'}</dd></div><div><dt>Scope</dt><dd className="whitespace-pre-wrap">{brief.scope}</dd></div><div><dt>Timeline</dt><dd>{brief.timing || 'Not set'}</dd></div><div><dt>Base price</dt><dd>{money(brief.price)}</dd></div><div><dt>Payment schedule</dt><dd>{brief.deposit === '50' ? '50% deposit, 50% balance' : 'One payment'}</dd></div></dl>
            <p className="mt-5 text-sm text-slate-600">Nothing has been shared. Next, check the full document, client details and final totals in the editor. An account is required to save a client link.</p>
          </div>}
          <div className="d4-form-actions">
            <button type="button" disabled={stage === 0} onClick={() => advance(stage - 1)} className="d4-secondary disabled:invisible"><ArrowLeft size={16} /> Back</button>
            <button type="submit" className="d4-primary">{['Continue', 'Payment options', 'Review brief', 'Review agreement'][stage]}<ArrowRight size={16} /></button>
          </div>
        </fieldset>
      </form>
      <aside aria-label="Live brief preview" className="d4-paper-wrap"><div className="d4-paper-caption"><span>Document preview</span><span>Draft</span></div>{document}</aside>
    </div>
    <dialog onKeyDown={keepDialogFocus} ref={dialog} className="d4-preview-dialog"><div className="mb-4 flex justify-between items-center gap-3"><h2 className="font-semibold">Document preview</h2><button className="d4-secondary" onClick={() => dialog.current?.close()}>Close</button></div>{document}</dialog>
    <p className="mt-8 border-t border-slate-200 pt-5 text-xs leading-5 text-slate-600">Free to draft. Browser drafts are local to this tab and expire after 24 hours. Review your agreement before sharing. A business-document starting point, not legal advice.</p>
  </section>;
}
