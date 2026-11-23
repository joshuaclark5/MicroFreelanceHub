import Link from 'next/link';
import { agreementQueue } from '../lib/agreementQueue';

export default function AgreementActionQueue({ records, ownerId }: { records: any[]; ownerId: string }) {
  const actions = agreementQueue(records, ownerId);
  return <section aria-labelledby="action-queue-title" className="rounded-xl border border-[#cad6ca] bg-[#fbfcfa] p-5 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="action-queue-title" className="text-xl font-semibold text-[#183e34]">Your next steps</h2><span className="text-sm text-slate-600">{actions.length} agreements to review</span></div>
    <p className="mt-2 text-sm text-slate-600">Start with drafts, then signatures and payment details. Nothing is sent or charged from this list.</p>
    {actions.length ? <ol className="mt-4 divide-y divide-[#cad6ca]">{actions.slice(0, 5).map(item => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
      <div className="min-w-0 flex-1"><h3 className="font-semibold break-words">{item.client}</h3><p className="mt-1 text-sm text-slate-600">{item.action.detail}</p></div>
      <Link href={item.action.href} aria-label={`${item.action.label} for ${item.client}`} className="inline-flex min-h-[44px] items-center rounded-lg border border-[#194d41] px-4 py-2 text-sm font-semibold text-[#194d41] hover:bg-[#e6efe7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">{item.action.label}</Link>
    </li>)}</ol> : <p className="mt-4 text-sm">No draft, signature or outstanding payment-review steps were found in the loaded agreements. This is not a payment reconciliation.</p>}
    {actions.length > 5 && <p className="mt-3 text-sm text-slate-600">Showing the first 5 of {actions.length}. Review the agreement list below for the rest.</p>}
    {!records.length && <Link href="/create" className="mt-4 inline-flex min-h-[44px] items-center font-semibold underline">Draft your first agreement</Link>}
  </section>;
}
