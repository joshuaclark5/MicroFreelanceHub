'use client';
import { useEffect, useRef, useState } from 'react';
import { supportDraft, supportTopics, type SupportTopic } from '../lib/supportHandoff';

export default function SupportHandoff({ request }: { request?: {topic: SupportTopic} | null }) {
  const [topic, setTopic] = useState<SupportTopic>('Something else');
  const [details, setDetails] = useState('');
  const [feedback, setFeedback] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const revision = useRef(0);
  const detailsInput = useRef<HTMLTextAreaElement>(null);
  const preview = useRef<HTMLDetailsElement>(null);
  const previewText = useRef<HTMLPreElement>(null);
  useEffect(() => {
    if (!request) return;
    revision.current++;
    setConfirmClear(false);
    setTopic(request.topic);
    setFeedback('Help topic selected. Any details you already entered are unchanged. Review the draft before sending.');
    detailsInput.current?.focus();
  }, [request]);
  useEffect(() => () => { revision.current++; }, []);
  // Keep sensitive drafts memory-only, but warn on browser close/reload.
  // Copying/opening email is not delivery confirmation, so retain the warning.
  const hasDetails = details.trim().length > 0;
  useEffect(() => {
    if (!hasDetails) return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeLeaving);
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving);
  }, [hasDetails]);
  const draft = supportDraft(topic, details);
  async function copy() {
    const request = ++revision.current;
    try {
      await navigator.clipboard.writeText(`To: support@microfreelancehub.com\nSubject: ${draft.subject}\n\n${draft.body}`);
      if (request !== revision.current) return;
      setFeedback('Draft copied. Paste it into your email app, review it and send when ready. Nothing has been sent yet.');
    } catch {
      if (request !== revision.current) return;
      if (preview.current) preview.current.open = true;
      previewText.current?.focus();
      setFeedback('Copy is unavailable. Select the preview below and copy it manually, then paste it into your email service. Nothing has been sent.');
    }
  }
  return <section className="mt-10 rounded-2xl bg-emerald-50 p-6 sm:p-7" aria-labelledby="human-support">
    <h2 id="human-support" className="text-xl font-semibold">Need a person?</h2>
    <p className="my-3 leading-7">Prepare an email for <a className="break-all font-semibold text-emerald-900 underline" href="mailto:support@microfreelancehub.com">support@microfreelancehub.com</a>. This form stays in this tab. It does not submit a ticket, send an email or save a draft after you leave. Your browser may warn before closing or reloading a tab with details entered, but cannot guarantee recovery. Copy anything you want to keep before leaving.</p>
    <label htmlFor="support-topic" className="block font-semibold">What do you need help with?</label>
    <select id="support-topic" value={topic} onChange={e => {revision.current++; setConfirmClear(false); setTopic(e.target.value as SupportTopic); setFeedback('');}} className="my-3 w-full rounded-xl border border-slate-300 bg-white p-3">
      {supportTopics.map(t => <option key={t}>{t}</option>)}
    </select>
    <label htmlFor="support-details" className="block font-semibold">What happened?</label>
    <p id="support-privacy" className="my-2 text-sm leading-6">Include the tool name, approximate time, what you expected and what happened instead. Do not paste passwords, codes, private links, client information or card details. For account access, never send a recovery link.</p>
    <textarea ref={detailsInput} id="support-details" aria-describedby="support-privacy" value={details} onChange={e => {revision.current++; setConfirmClear(false); setDetails(e.target.value); setFeedback('');}} maxLength={1500} rows={5} placeholder="For example: In Time tracking, I tried saving an entry but saw an error. I have not created another entry." className="w-full rounded-xl border border-slate-300 p-3"/>
    <p className="my-2 text-sm text-slate-600">{details.length}/1500 characters. Review and redact before sending.</p>
    <details ref={preview} className="my-4 rounded-xl border border-emerald-200 bg-white p-4"><summary className="cursor-pointer font-semibold">Review email draft</summary><p className="my-3 font-semibold">{draft.subject}</p><button type="button" className="mb-3 rounded-lg border border-emerald-900 px-4 py-3 text-emerald-900" onClick={() => {
      const text = previewText.current;
      const selection = window.getSelection();
      if (!text || !selection) return;
      revision.current++;
      text.focus();
      const range = document.createRange();
      range.selectNodeContents(text);
      selection.removeAllRanges();
      selection.addRange(range);
      setFeedback('Draft text selected. Use your device’s Copy command, then paste into your email app. Nothing has been sent.');
    }}>Select draft text</button><pre ref={previewText} tabIndex={-1} aria-label="Full email draft" className="whitespace-pre-wrap break-words font-sans text-sm leading-6">{`To: support@microfreelancehub.com\nSubject: ${draft.subject}\n\n${draft.body}`}</pre></details>
    {!draft.canOpenEmail && <p role="status" className="my-3 text-sm leading-6">This draft is too long for a reliable email link. Use Copy draft, or select the full preview and paste it into your email service. Your details have not been shortened.</p>}
    <div className="flex flex-wrap gap-3">
      {draft.canOpenEmail && <a href={draft.href} onClick={() => { revision.current++; setFeedback('Your email app may open a draft. Review it and press Send there. Opening this link does not confirm delivery.'); }} className="rounded-xl bg-emerald-900 px-4 py-3 font-semibold text-white">Open email draft</a>}
      <button type="button" onClick={() => void copy()} className="rounded-xl border border-emerald-900 px-4 py-3 font-semibold text-emerald-900">Copy draft</button>
      <button type="button" onClick={() => {revision.current++; setConfirmClear(true); setFeedback('');}} aria-expanded={confirmClear} aria-controls="support-clear-confirmation" className="px-4 py-3 text-emerald-900 underline">Clear draft</button>
    </div>
    {confirmClear && <div id="support-clear-confirmation" role="group" aria-labelledby="support-clear-label" className="mt-4 rounded-xl border border-emerald-900 bg-white p-4">
      <p id="support-clear-label">Clear this draft? Entered details will be removed from this tab. Copies in your clipboard or email app will not change.</p>
      <div className="mt-3 flex flex-wrap gap-3">
        <button type="button" onClick={() => {setConfirmClear(false); detailsInput.current?.focus();}} className="rounded-xl border border-emerald-900 px-4 py-3">Keep draft</button>
        <button type="button" onClick={() => {revision.current++; setDetails(''); setTopic('Something else'); setConfirmClear(false); setFeedback('Draft cleared from this form. Any copy in your clipboard or email app is unchanged.'); detailsInput.current?.focus();}} className="rounded-xl bg-emerald-900 px-4 py-3 text-white">Confirm clear draft</button>
      </div>
    </div>}
    <p role="status" className="mt-3 text-sm leading-6">{feedback}</p>
    <p className="mt-3 text-sm leading-6">No email app configured? Copy the draft into your usual email service. A support response time has not been established.</p>
  </section>;
}
