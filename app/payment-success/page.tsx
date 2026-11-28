import Link from 'next/link';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import Stripe from 'stripe';
import { billingLiveMode, verifiedBilling, VerifiedBilling } from '../lib/server/billingStatus';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Check your subscription | MicroFreelanceHub', robots: { index: false, follow: false } };

export default async function PaymentSuccessPage({ searchParams }: { searchParams: { session_id?: string | string[] } }) {
  let state: VerifiedBilling | null = null;
  let signedIn = false;
  let unavailable = false;
  try {
    const supabase = createServerComponentClient({ cookies });
    const { data: { user }, error } = await supabase.auth.getUser();
    signedIn = !!user && !error;
    if (user && !error) {
      const { data: profile, error: profileError } = await supabase.from('profiles').select('stripe_customer_id,subscription_id').eq('id', user.id).maybeSingle();
      if (profileError) throw new Error('Profile lookup failed');
      const key = process.env.STRIPE_SECRET_KEY;
      state = await verifiedBilling(profile?.stripe_customer_id ? new Stripe(key!) : null, profile, user.id, profile?.stripe_customer_id ? billingLiveMode(key) : true, searchParams.session_id);
    }
  } catch {
    unavailable = true;
    console.warn('billing_return_verification_unavailable');
  }
  const active = state?.verification === 'active' && !state.testMode;
  const heading = unavailable ? 'We could not verify your subscription' : !signedIn ? 'Sign in to check your subscription' : state?.testMode ? 'Test-mode billing result' : active ? 'Your subscription is active' : state?.verification === 'ended' ? 'Your subscription has ended' : state?.verification === 'trial' ? 'Your subscription is in a trial' : state?.verification === 'none' ? 'No subscription found' : 'Your subscription is not yet confirmed';
  return <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900">
    <section className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-10">
      <p className="text-sm font-semibold text-blue-700">MicroFreelanceHub billing</p>
      <h1 className="mt-3 text-3xl font-bold">{heading}</h1>
      <p className="mt-4 text-slate-600">{unavailable ? 'Your saved account access has not been changed by this check. Try again or open billing settings. Do not purchase again just because this page could not verify the result.' : !signedIn ? 'Use the account you used at checkout. Opening this page does not activate a plan or confirm a payment.' : state?.testMode ? 'This result is from provider test facilities. It is not a real payment or proof of production access.' : active ? 'This status was checked with the billing provider for your signed-in account. Payment collection for client work has separate merchant requirements.' : 'A return from checkout alone does not confirm payment or activate access. Review the current status in billing settings before trying another purchase.'}</p>
      {state && <dl className="mt-6 space-y-3 rounded-xl bg-slate-50 p-4">
        <div><dt className="font-semibold">Plan</dt><dd>{state.plan}</dd></div>
        <div><dt className="font-semibold">Provider status</dt><dd>{state.status}</dd></div>
        <div><dt className="font-semibold">Billing interval</dt><dd>{state.cycle}</dd></div>
        {state.nextDate && <div><dt className="font-semibold">{state.cancelAtPeriodEnd ? 'Scheduled cancellation' : 'Current billing period date'}</dt><dd>{new Date(state.nextDate).toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' })} (UTC)</dd></div>}
      </dl>}
      <div className="mt-8 flex flex-wrap gap-3">
        <Link className="rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white" href={signedIn ? '/settings' : '/login?mode=signin&next=%2Fpayment-success'}>{signedIn ? 'Open billing settings' : 'Sign in'}</Link>
        <Link className="rounded-lg border border-slate-300 px-4 py-3" href="/payment-success">Check again</Link>
        <Link className="rounded-lg border border-slate-300 px-4 py-3" href="/dashboard">Dashboard</Link>
      </div>
      <p className="mt-6 text-sm"><a className="underline" href="mailto:admin@microfreelancehub.com">Contact support</a> if you need help identifying a charge.</p>
    </section>
  </main>;
}
