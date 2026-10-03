'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, FileSignature } from 'lucide-react';

export default function AgreementExample() {
  const [service, setService] = useState(false);
  const [change, setChange] = useState(false);
  return <section id="agreement-example" aria-label="Sample agreement workflow" className="d4-example scroll-mt-24">
    <div className="d4-example-bar"><strong>Explore a sample client link</strong><span>Illustration · no transactions</span></div>
    <div className="flex flex-wrap gap-2 px-5 pt-5" role="group" aria-label="Example business">
      <button type="button" className="d4-tab" aria-pressed={!service} onClick={() => setService(false)}>Creative project</button>
      <button type="button" className="d4-tab" aria-pressed={service} onClick={() => setService(true)}>Service job</button>
    </div>
    <div className="d4-example-grid">
      <div className="p-5 sm:p-8">
        <p className="d4-eyebrow">{change ? 'Proposed addition · awaiting approval' : 'Agreement · ready for client review'}</p>
        <h2 className="mt-3 text-2xl font-semibold text-slate-950">{service ? 'Gutter installation' : 'Website redesign'}</h2>
        <p className="mt-2 text-sm text-slate-600">{service ? 'Example Home Services + Sample Property' : 'Example Design Studio + Sample Client'}</p>
        <dl className="mt-6 space-y-4 text-sm">
          <div><dt className="font-semibold text-slate-900">{change ? 'Added scope' : 'Included work'}</dt><dd className="mt-1 text-slate-600">{service ? (change ? 'Add a separately quoted gutter section at the rear entrance.' : 'Install the agreed gutter sections and downspouts; remove the replaced materials.') : (change ? 'Add a booking page using the client’s supplied scheduling link.' : 'Five website pages, mobile layouts and two rounds of revisions.')}</dd></div>
          <div><dt className="font-semibold text-slate-900">{change ? 'Timeline adjustment' : 'What happens next'}</dt><dd className="mt-1 text-slate-600">{change ? 'Two additional business days, subject to client approval.' : 'Review the scope and terms, sign, then follow the attached payment step.'}</dd></div>
        </dl>
        <button type="button" className="d4-secondary mt-6" aria-pressed={change} onClick={() => setChange(!change)}>{change ? 'Back to original scope' : 'What if the client adds work?'} <ArrowRight size={16}/></button>
      </div>
      <aside className="border-t border-slate-200 bg-blue-50/60 p-5 sm:p-8 md:border-l md:border-t-0">
        <p className="text-xs font-semibold uppercase text-slate-600">{change ? 'Additional amount' : 'Example project total'}</p>
        <p className="mt-2 text-3xl font-semibold text-slate-950">{change ? '$350' : '$2,400'}</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">{change ? 'Approval and payment are separate steps. Review revised terms before proceeding.' : '$1,200 example deposit after signing. Payment collection uses the provider’s connected Stripe account.'}</p>
        <div className="my-5 space-y-3 text-sm text-slate-700"><p className="flex items-center gap-2"><FileSignature size={17}/> {change ? 'Review the change' : 'Review and sign'}</p><p className="flex items-center gap-2"><CheckCircle2 size={17}/> {change ? 'Record the agreed addition' : 'Continue to payment'}</p></div>
        <Link href="/create" className="d4-primary w-full">Start my agreement <ArrowRight size={16}/></Link>
        <p className="mt-3 text-xs leading-5 text-slate-600">Sample data, not a customer result. Plan limits and Stripe eligibility apply.</p>
      </aside>
    </div>
  </section>;
}
