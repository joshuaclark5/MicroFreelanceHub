'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ArrowRight, CheckCircle2, Clipboard, Loader2, Mail, Sparkles } from 'lucide-react';

type Scenario =
  | 'late-payment'
  | 'scope-creep'
  | 'final-files'
  | 'revision-request'
  | 'ghosted-invoice'
  | 'discount-request'
  | 'approval-delay'
  | 'vague-feedback';

type Tone = 'calm' | 'firm' | 'friendly';

const scenarios: Array<{ value: Scenario; label: string; hint: string }> = [
  { value: 'late-payment', label: 'Late payment', hint: 'Follow up after an invoice due date passes.' },
  { value: 'scope-creep', label: 'Scope creep', hint: 'Respond when a request adds work.' },
  { value: 'final-files', label: 'Final file handoff', hint: 'Set next steps before delivery.' },
  { value: 'revision-request', label: 'Extra revisions', hint: 'Reply to additional feedback rounds.' },
  { value: 'ghosted-invoice', label: 'Ghosted invoice', hint: 'Restart a stalled payment thread.' },
  { value: 'discount-request', label: 'Discount request', hint: 'Hold pricing without sounding tense.' },
  { value: 'approval-delay', label: 'Approval delay', hint: 'Move a review window forward.' },
  { value: 'vague-feedback', label: 'Vague feedback', hint: 'Ask for clearer direction.' },
];

const toneLabels: Record<Tone, string> = {
  calm: 'Calm',
  firm: 'Firm',
  friendly: 'Friendly',
};

const exampleContext: Record<Scenario, string> = {
  'late-payment': 'My final invoice was due last Friday. The client said they would pay this week, but I have not heard back.',
  'scope-creep': 'The client approved the landing page copy, but now wants two extra service pages added before launch.',
  'final-files': 'The client asked for editable source files today. The final invoice is still open and I want to keep the tone professional.',
  'revision-request': 'The project included two revision rounds. The client has sent a third round of edits and says they are small changes.',
  'ghosted-invoice': 'I sent the invoice 12 days ago and followed up once. The client opened the email but has not replied.',
  'discount-request': 'A prospect likes the proposal but asked if I can reduce the price by 30 percent.',
  'approval-delay': 'The client has had the draft for a week. I need approval or consolidated feedback so the project can keep moving.',
  'vague-feedback': 'The client replied with "make it pop" and "not quite there" but did not explain what should change.',
};

const defaultMessages: Record<Scenario, string> = {
  'late-payment':
    'Hi [Client Name], I wanted to follow up on invoice [Invoice Number], which was due on [Due Date]. Could you confirm when payment is expected to be sent? Once that is handled, I can keep the remaining project steps moving smoothly. Thanks.',
  'scope-creep':
    'Hi [Client Name], thanks for sending this over. This request adds work beyond the current project scope, so I can price it as an added item and share the updated timeline before I begin. If you want, I can send that update today.',
  'final-files':
    'Hi [Client Name], I can prepare the final files for handoff. Before I send the editable/source files, let us close out the remaining invoice and confirm the final delivery list so everything is wrapped up clearly.',
  'revision-request':
    'Hi [Client Name], thanks for the notes. The included revision rounds have already been used, so I can handle these as an additional revision round. I can send the added cost and timing for approval before making the updates.',
  'ghosted-invoice':
    'Hi [Client Name], checking back in on invoice [Invoice Number]. I may have missed your update, so could you let me know where this stands? Once payment timing is confirmed, I can close out the project records on my side.',
  'discount-request':
    'Hi [Client Name], I appreciate you being upfront about budget. I am not able to reduce the full project price by that amount, but I can suggest a smaller scope that fits closer to your target budget if that would help.',
  'approval-delay':
    'Hi [Client Name], I wanted to check in on the pending review. To keep the project moving, could you send approval or consolidated feedback by [Date]? If I do not hear back, I can follow up with the next best project step.',
  'vague-feedback':
    'Hi [Client Name], thanks for reviewing this. To make the next revision useful, could you share what specifically feels off and one or two examples of the direction you want? That will help me make a cleaner update.',
};

function getScenarioMeta(scenario: Scenario) {
  return scenarios.find((item) => item.value === scenario) || scenarios[0];
}

export default function ClientMessageGenerator({
  initialScenario = 'late-payment',
}: {
  initialScenario?: Scenario;
}) {
  const [scenario, setScenario] = useState<Scenario>(initialScenario);
  const [tone, setTone] = useState<Tone>('calm');
  const [context, setContext] = useState(exampleContext[initialScenario]);
  const [message, setMessage] = useState(defaultMessages[initialScenario]);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState('');
  const [emailCaptured, setEmailCaptured] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const supabase = createClientComponentClient();
  const selectedScenario = useMemo(() => getScenarioMeta(scenario), [scenario]);

  const changeScenario = (nextScenario: Scenario) => {
    setScenario(nextScenario);
    setContext(exampleContext[nextScenario]);
    setMessage(defaultMessages[nextScenario]);
    setCopied(false);
  };

  const generateMessage = async () => {
    setIsLoading(true);
    setCopied(false);

    try {
      const response = await fetch('/api/tools/client-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario, tone, context }),
      });
      const data = await response.json();
      setMessage(data.message || defaultMessages[scenario]);
    } catch {
      setMessage(defaultMessages[scenario]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyMessage = async () => {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const captureEmail = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) return;

    setEmailError(false);

    const { error } = await supabase.from('feedback').insert({
      email,
      message: `Client reply tool launch-list signup. Scenario: ${scenario}. Tone: ${tone}.`,
      page_url: typeof window !== 'undefined' ? window.location.pathname : '/tools/client-message-generator',
    });

    if (error) {
      setEmailError(true);
    } else {
      setEmailCaptured(true);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/70">
      <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
        <div className="border-b border-slate-200 p-5 sm:p-8 lg:border-b-0 lg:border-r">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Free client tool</p>
              <h2 className="text-xl font-extrabold text-slate-900">Create a client reply</h2>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="mb-3 block text-sm font-bold text-slate-900">What happened?</label>
              <div className="grid gap-2 sm:grid-cols-2">
                {scenarios.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => changeScenario(item.value)}
                    className={`rounded-xl border px-3 py-3 text-left text-sm transition-all ${
                      scenario === item.value
                        ? 'border-blue-600 bg-blue-50 text-blue-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className="block font-bold">{item.label}</span>
                    <span className="mt-1 block text-xs text-slate-500">{item.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-3 block text-sm font-bold text-slate-900">Tone</label>
              <div className="grid grid-cols-3 rounded-xl border border-slate-200 bg-slate-50 p-1">
                {(Object.keys(toneLabels) as Tone[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setTone(item)}
                    className={`rounded-lg px-3 py-2 text-sm font-bold transition ${
                      tone === item ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {toneLabels[item]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="client-context" className="mb-3 block text-sm font-bold text-slate-900">
                Situation details
              </label>
              <textarea
                id="client-context"
                rows={7}
                value={context}
                onChange={(event) => setContext(event.target.value)}
                className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                placeholder="Paste the client situation or write a quick summary..."
              />
            </div>

            <button
              type="button"
              onClick={generateMessage}
              disabled={isLoading || context.trim().length < 10}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-4 text-sm font-extrabold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mail className="h-5 w-5" />}
              {isLoading ? 'Writing reply...' : 'Generate reply'}
            </button>
          </div>
        </div>

        <div className="flex flex-col p-5 sm:p-8">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{selectedScenario.label}</p>
              <h3 className="mt-1 text-2xl font-extrabold text-slate-900">Your draft reply</h3>
            </div>
            <button
              type="button"
              onClick={copyMessage}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <Clipboard className="h-4 w-4" />
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <div className="min-h-[320px] flex-1 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed text-slate-800">{message}</pre>
          </div>

          <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
            {emailCaptured ? (
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="font-bold text-slate-900">Saved for the launch list.</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Next step: save message history, follow-up reminders, and reusable client snippets.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={captureEmail} className="grid gap-3 md:grid-cols-[1fr_auto]">
                <div>
                  <label htmlFor="tool-email" className="text-sm font-bold text-slate-900">
                    Want the full client reply library?
                  </label>
                  <input
                    id="tool-email"
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
                <button
                  type="submit"
                  className="self-end rounded-xl bg-slate-900 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-black"
                >
                  Send me updates
                </button>
                {emailError && (
                  <p className="md:col-span-2 text-sm font-semibold text-red-600">
                    Could not save that email. Please try again.
                  </p>
                )}
              </form>
            )}
          </div>

          <div className="mt-5 flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>This tool drafts business communication only. It does not provide legal advice.</p>
            <Link href="/create?source=client-message-tool" className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-700">
              Create a project link
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
