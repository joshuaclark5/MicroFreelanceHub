'use client';

import { useState } from 'react';
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';

type SubmitState = {
  referralLink?: string;
  message?: string;
};

export default function PartnerApplicationForm() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<SubmitState | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setResult(null);

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch('/api/partners/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to submit partner request.');
      }

      setResult(data);
      event.currentTarget.reset();
    } catch (err: any) {
      setError(err.message || 'Unable to submit partner request.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-xl font-bold tracking-normal text-slate-950">Request a partner link</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Get a provisional link now. Joshua will review partner fit before commissions are approved.
        </p>
      </div>

      {result?.referralLink ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-emerald-800">
            <CheckCircle2 className="h-5 w-5" />
            Partner request received
          </div>
          <p className="text-sm leading-6 text-emerald-900">{result.message}</p>
          <div className="mt-4 rounded-md border border-emerald-200 bg-white px-3 py-3">
            <code className="block break-all text-xs text-slate-800">{result.referralLink}</code>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Name
              </label>
              <input
                id="name"
                name="name"
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Creator or business name"
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="channelUrl" className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Website or channel
            </label>
            <input
              id="channelUrl"
              name="channelUrl"
              type="url"
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="https://..."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="audience" className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Audience
              </label>
              <input
                id="audience"
                name="audience"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Freelancers, designers, writers..."
              />
            </div>
            <div>
              <label htmlFor="audienceSize" className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Audience size
              </label>
              <input
                id="audienceSize"
                name="audienceSize"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Newsletter, YouTube, community..."
              />
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="How would you share MicroFreelanceHub?"
            />
          </div>

          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            {submitting ? 'Sending request' : 'Get provisional link'}
          </button>
        </form>
      )}
    </div>
  );
}
