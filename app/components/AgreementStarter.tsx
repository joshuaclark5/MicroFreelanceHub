'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, FileText } from 'lucide-react';
import { trackAgreementEvent } from '../lib/agreementEvents';

export type AgreementBrief = { title: string; scope: string; timing: string; price: string };

export default function AgreementStarter({ onComplete, onSkip }: {
  onComplete: (brief: AgreementBrief) => void;
  onSkip: () => void;
}) {
  const [stage, setStage] = useState(0);
  const [brief, setBrief] = useState<AgreementBrief>({ title: '', scope: '', timing: '', price: '' });
  const [restored, setRestored] = useState(false);
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem('mfh-agreement-brief-v1') || 'null');
      if (saved && Date.now() - saved.savedAt < 86400000 &&
          ['title', 'scope', 'timing', 'price'].every(key => typeof saved.brief?.[key] === 'string')) {
        setBrief({ title: saved.brief.title.slice(0, 160), scope: saved.brief.scope.slice(0, 12000), timing: saved.brief.timing.slice(0, 1000), price: saved.brief.price.slice(0, 30) });
        setStage(Number.isInteger(saved.stage) && saved.stage >= 0 && saved.stage <= 2 ? saved.stage : 0);
      }
    } catch { /* Storage can be unavailable in private browsing. */ }
    setRestored(true);
  }, []);
  useEffect(() => {
    if (!restored) return;
    try {
      sessionStorage.setItem('mfh-agreement-brief-v1', JSON.stringify({ brief, stage, savedAt: Date.now() }));
    } catch { /* Drafting remains available without browser storage. */ }
  }, [brief, stage, restored]);
  const labels = ['Project', 'Scope', 'Review'];
  const field = 'mt-2 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-600';

  return <section className="mx-auto max-w-3xl p-6 sm:p-10">
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-5">
      <span className="flex items-center gap-2 text-sm font-semibold text-blue-700"><FileText size={18} /> New agreement</span>
      <button type="button" onClick={onSkip} className="text-sm font-medium text-gray-600 underline underline-offset-4">Open the editor instead</button>
    </div>
    <ol aria-label="Agreement progress" className="my-7 flex gap-5 text-sm">
      {labels.map((label, index) => <li key={label} aria-current={stage === index ? 'step' : undefined} className={stage === index ? 'font-semibold text-blue-700' : 'text-gray-500'}>{index + 1}. {label}</li>)}
    </ol>
    <form onSubmit={event => {
      event.preventDefault();
      trackAgreementEvent(stage === 0 ? 'agreement_started' : stage === 1 ? 'agreement_scope_completed' : 'agreement_editor_opened');
      stage < 2 ? setStage(stage + 1) : onComplete(brief);
    }}>
      <fieldset disabled={!restored}>
      {stage === 0 && <>
        <h1 className="text-3xl font-semibold text-gray-950">What are you working on?</h1>
        <label className="mt-7 block font-medium">Project name<input autoFocus required maxLength={160} value={brief.title} onChange={e => setBrief({ ...brief, title: e.target.value })} className={field} placeholder="Website redesign for Acme" /></label>
        <label className="mt-6 block font-medium">Project price (USD, optional)<input type="number" min="0" step="0.01" value={brief.price} onChange={e => setBrief({ ...brief, price: e.target.value })} className={field} placeholder="2500" /></label>
      </>}
      {stage === 1 && <>
        <h1 className="text-3xl font-semibold text-gray-950">Put the scope in writing.</h1>
        <label className="mt-7 block font-medium">Deliverables and included revisions<textarea autoFocus required maxLength={12000} rows={6} value={brief.scope} onChange={e => setBrief({ ...brief, scope: e.target.value })} className={field} placeholder="Five website pages, mobile layouts, and two rounds of revisions." /></label>
        <label className="mt-6 block font-medium">Timeline and milestones (optional)<input maxLength={1000} value={brief.timing} onChange={e => setBrief({ ...brief, timing: e.target.value })} className={field} placeholder="First draft in two weeks; final delivery after approval." /></label>
      </>}
      {stage === 2 && <>
        <h1 className="text-3xl font-semibold text-gray-950">Your agreement starts here.</h1>
        <dl className="mt-7 space-y-5 border-y border-gray-200 py-6">
          <div><dt className="text-sm text-gray-500">Project</dt><dd className="mt-1 break-words font-semibold">{brief.title}</dd></div>
          <div><dt className="text-sm text-gray-500">Scope</dt><dd className="mt-1 whitespace-pre-wrap break-words">{brief.scope}</dd></div>
          {brief.timing && <div><dt className="text-sm text-gray-500">Timeline</dt><dd className="mt-1 break-words">{brief.timing}</dd></div>}
          <div><dt className="text-sm text-gray-500">Base project price</dt><dd className="mt-1">{brief.price ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(brief.price)) : 'Not set'}</dd></div>
        </dl>
        <p className="mt-5 text-sm leading-6 text-gray-600">Review the full agreement and payment settings next. Taxes and any selected fees appear in the editor. This is a business-document starting point, not legal advice.</p>
      </>}
      <div className="mt-8 flex items-center justify-between gap-3">
        <button type="button" disabled={stage === 0} onClick={() => setStage(stage - 1)} className="flex items-center gap-2 py-3 text-sm font-medium disabled:invisible"><ArrowLeft size={16} /> Back</button>
        <button type="submit" className="flex items-center gap-2 rounded-md bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800">{stage === 2 ? 'Review agreement' : 'Continue'}<ArrowRight size={18} /></button>
      </div>
      </fieldset>
    </form>
    <p className="mt-8 border-t border-gray-200 pt-5 text-sm text-gray-500">Free to draft. No Stripe connection needed to preview. An account is required to save a client link; plan limits apply.</p>
  </section>;
}
