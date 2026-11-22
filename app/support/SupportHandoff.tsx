'use client';
import { useEffect, useRef, useState } from 'react';
import { supportDraft, supportTopics, type SupportTopic } from '../lib/supportHandoff';

export default function SupportHandoff({ request }: { request?: {topic: SupportTopic} | null }) {
  const [topic, setTopic] = useState<SupportTopic>('Something else');
  const [details, setDetails] = useState('');
  const [feedback, setFeedback] = useState('');
  const revision = useRef(0);
  const detailsInput = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (!request) return;
    revision.current++;
    setTopic(request.topic);
    setFeedback('Help topic selected. Any details you already entered are unchanged. Review the draft before sending.');
    detailsInput.current?.focus();
  }, [request]);
  useEffect(() => () => { revision.current++; }, []);
  const draft = supportDraft(topic, details);
  async function copy() {
    const request = ++revision.current;
    try {
      await navigator.clipboard.writeText(`To: support@microfreelancehub.com\nSubject: ${draft.subject}\n\n${draft.body}`);
      if (request !== revision.current) return;
      setFeedback('Draft copied. Paste it into your email app, review it and send when ready. Nothing has been sent yet.');
    } catch {
      if (request !== revision.current) return;
      setFeedback('Copy is unavailable. Select the preview below and copy it manually, or use Open email draft. Nothing has been sent.');
    }
  }
  return <section className="mt-10 rounded-2xl bg-emerald-50 p-6 sm:p-7" aria-labelledby="human-support">
    <h2 id="human-support" className="text-xl font-semibold">Need a person?</h2>
    <p className="my-3 leading-7">Prepare an email for <a className="break-all font-semibold text-emerald-900 underline" href="mailto:support@microfreelancehub.com">support@microfreelancehub.com</a>. This form stays in this tab. It does not submit a ticket, send an email or save a draft after you leave.</p>
    <label htmlFor="support-topic" className="block font-semibold">What do you need help with?</label>
    <select id="support-topic" value={topic} onChange={e => {revision.current++; setTopic(e.target.value as SupportTopic); setFeedback('');}} className="my-3 w-full rounded-xl border border-slate-300 bg-white p-3">
      {supportTopics.map(t => <option key={t}>{t}</option>)}
    </select>
    <label htmlFor="support-details" className="block font-semibold">What happened?</label>
    <p id="support-privacy" className="my-2 text-sm leading-6">Include the tool name, approximate time, what you expected and what happened instead. Do not paste passwords, codes, private links, client information or card details. For account access, never send a recovery link.</p>
    <textarea ref={detailsInput} id="support-details" aria-describedby="support-privacy" value={details} onChange={e => {revision.current++; setDetails(e.target.value); setFeedback('');}} maxLength={1500} rows={5} placeholder="For example: In Time tracking, I tried saving an entry but saw an error. I have not created another entry." className="w-full rounded-xl border border-slate-300 p-3"/>
    <p className="my-2 text-sm text-slate-600">{details.length}/1500 characters. Review and redact before sending.</p>
    <details className="my-4 rounded-xl border border-emerald-200 bg-white p-4"><summary className="cursor-pointer font-semibold">Review email draft</summary><p className="my-3 font-semibold">{draft.subject}</p><pre className="whitespace-pre-wrap break-words font-sans text-sm leading-6">{draft.body}</pre></details>
    <div className="flex flex-wrap gap-3">
      <a href={draft.href} onClick={() => { revision.current++; setFeedback('Your email app may open a draft. Review it and press Send there. Opening this link does not confirm delivery.'); }} className="rounded-xl bg-emerald-900 px-4 py-3 font-semibold text-white">Open email draft</a>
      <button type="button" onClick={() => void copy()} className="rounded-xl border border-emerald-900 px-4 py-3 font-semibold text-emerald-900">Copy draft</button>
      <button type="button" onClick={() => {revision.current++; setDetails(''); setTopic('Something else'); setFeedback('Draft cleared from this form. Any copy in your clipboard or email app is unchanged.');}} className="px-4 py-3 text-emerald-900 underline">Clear draft</button>
    </div>
    <p role="status" className="mt-3 text-sm leading-6">{feedback}</p>
    <p className="mt-3 text-sm leading-6">No email app configured? Copy the draft into your usual email service. A support response time has not been established.</p>
  </section>;
}
