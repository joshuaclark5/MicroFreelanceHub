'use client';
import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CreditCard } from 'lucide-react';
import type { SubscriptionReceipt } from '../lib/subscriptionReceipt';

function CheckoutReturn() {
  const params = useSearchParams();
  const sessionId = params.get('session_id');
  const [receipt, setReceipt] = useState<SubscriptionReceipt | { state: 'loading' | 'signin' }>({ state: 'loading' });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setReceipt({ state: 'loading' });
    if (!sessionId) { setReceipt({ state: 'unavailable' }); return; }
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    fetch('/api/stripe/checkout-status?' + new URLSearchParams({ session_id: sessionId }), { cache: 'no-store', signal: controller.signal })
      .then(async response => {
        if (response.status === 401) return { state: 'signin' } as const;
        if (!response.ok) throw new Error('Verification unavailable');
        const data = await response.json();
        if (!['confirmed', 'pending', 'unavailable'].includes(data.state) || (data.state === 'confirmed' && typeof data.plan !== 'string')) throw new Error('Invalid receipt');
        return data;
      }).then(data => { if (!controller.signal.aborted) setReceipt(data); })
      .catch(() => { if (active) setReceipt({ state: 'unavailable' }); })
      .finally(() => window.clearTimeout(timeout));
    return () => { active = false; window.clearTimeout(timeout); controller.abort(); };
  }, [sessionId, attempt]);
  const confirmed = receipt.state === 'confirmed';
  const title = confirmed ? receipt.plan + ' subscription confirmed.' : receipt.state === 'loading' ? 'Checking your subscription…' : receipt.state === 'signin' ? 'Sign in to check your subscription.' : receipt.state === 'pending' ? 'Confirmation is still pending.' : 'We could not confirm this checkout.';
  const returnTo = '/payment-success' + (sessionId ? '?' + new URLSearchParams({ session_id: sessionId }) : '');
  return <main className="mfh-payment-return min-h-screen bg-slate-950 px-4 py-16 text-white">
    <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white p-6 sm:p-8 text-center text-slate-900 shadow-2xl">
      <CreditCard className="mx-auto mb-6 h-10 w-10 text-emerald-700" aria-hidden="true" />
      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-emerald-800">Subscription checkout</p>
      <div role="status" aria-live="polite"><h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-5 text-slate-600 leading-7">{confirmed ? 'Stripe reports a completed checkout payment and an active subscription for your account. The account profile is not proof of payment or entitlement. This is your platform subscription, not a client payment.' : receipt.state === 'loading' ? 'Checking Stripe and your account record. A checkout return link alone does not confirm payment.' : 'No payment or plan activation is confirmed on this screen. If you just paid, allow a moment and check again. Do not start another checkout to resolve a pending confirmation.'}</p></div>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
        {receipt.state === 'signin' ? <Link className="d4-primary" href={'/login?mode=signin&' + new URLSearchParams({ returnTo })}>Sign in to verify</Link> : !confirmed && <button className="d4-primary" disabled={receipt.state === 'loading'} onClick={() => setAttempt(n => n + 1)}>Check again</button>}
        <Link href="/settings" className="d4-secondary">Review billing settings</Link>
        <Link href="/dashboard" className="d4-secondary">Go to dashboard</Link>
      </div>
      <p className="mt-8 text-xs leading-5 text-slate-600">If confirmation remains unavailable, review billing settings before making another purchase. No billing changes are made by this check.</p>
    </div>
  </main>;
}
export default function PaymentSuccessPage() { return <Suspense fallback={<main className="p-8" role="status">Loading checkout status…</main>}><CheckoutReturn /></Suspense>; }
