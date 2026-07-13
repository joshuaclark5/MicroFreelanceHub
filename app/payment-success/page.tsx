import Link from 'next/link';
import { ArrowRight, CheckCircle2, CreditCard } from 'lucide-react';

type Props = {
  searchParams: {
    plan?: string;
    session_id?: string;
    landing_page?: string;
    lead_source?: string;
  };
};

function planLabel(plan?: string) {
  if (plan === 'pro') return 'Professional';
  if (plan === 'agency') return 'Agency';
  return 'Starter';
}

export default function PaymentSuccessPage({ searchParams }: Props) {
  const plan = planLabel(searchParams.plan);

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white p-8 text-center text-slate-900 shadow-2xl">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <CreditCard className="h-9 w-9" />
        </div>

        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-blue-700">Paid plan activated</p>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">
          Welcome to {plan}.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-slate-600">
          Your paid MicroFreelanceHub plan is active. You can now create client-ready contracts, collect signatures, and send payment links from your dashboard.
        </p>

        <div className="mt-8 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left">
          {['Create or open a project', 'Send one signature and payment link', 'Track signed and paid work from the dashboard'].map((item) => (
            <div key={item} className="flex items-center gap-3 text-sm font-bold text-slate-700">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
              {item}
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/dashboard?upgrade=success" className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700">
            Go to dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/create" className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-6 py-3 font-bold text-slate-700 hover:bg-slate-50">
            Create contract
          </Link>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-5 text-left text-xs text-slate-400">
          <p>Analytics route: paid-plan conversion</p>
          <p>Plan: {searchParams.plan || 'starter'}</p>
          {searchParams.landing_page && <p>Landing page: {searchParams.landing_page}</p>}
          {searchParams.lead_source && <p>Lead source: {searchParams.lead_source}</p>}
          {searchParams.session_id && <p>Stripe session: {searchParams.session_id}</p>}
        </div>
      </div>
    </div>
  );
}
