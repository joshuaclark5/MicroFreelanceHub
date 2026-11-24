'use client';

import {BrandMark} from '../components/Brand';
import { PLAN_PRICES, PaidPlan, BillingCycle, planQuote } from '../lib/planPricing';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { CheckCircle2, X, ShieldCheck, ArrowRight } from 'lucide-react';
import { getTrackedData } from '../lib/trackingClient';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data?.session?.user || null);
      setLoading(false);
    };
    checkAuth();
  }, [supabase]);

  // --- STRIPE CHECKOUT HANDLER ---
  const handlePricingClick = (plan: PaidPlan) => {
    const { landing_page, lead_source } = getTrackedData();
    const url = new URL('/checkout-plan', window.location.origin);
    url.searchParams.set('plan',plan);
    url.searchParams.set('billing',billingCycle);
    if(landing_page) url.searchParams.set('landing_page',landing_page);
    if(lead_source) url.searchParams.set('lead_source',lead_source);
    window.location.assign(url.toString());
  };

  if (loading) {
    return (
      <div className="public-design public-pricing min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-slate-600">Loading pricing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="public-design public-pricing d4-pricing min-h-screen bg-[#f6f8f7] font-sans text-slate-900 selection:bg-blue-100 pb-24">
      {/* NAVBAR */}
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <BrandMark/>
            <span className="font-semibold text-sm sm:text-base text-slate-900">MicroFreelanceHub</span>
          </Link>
          <div className="flex gap-4 items-center">
            {user ? (
              <Link href="/dashboard" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors hidden sm:block">Dashboard</Link>
            ) : (
              <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors hidden sm:block">Log in</Link>
            )}
            <Link href="/login" className="bg-blue-600 text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-blue-700 transition-all shadow-md">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* HEADER */}
      <div className="max-w-6xl mx-auto pt-10 pb-8 px-5">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-normal text-slate-900 mb-6">
          A clearer way to start <span className="text-blue-600">client work.</span>
        </h1>
        <p className="text-base text-slate-600 leading-relaxed">
          Choose the plan that helps you outline scope, pricing, approvals, timelines, signatures, and payment steps.
        </p>
      </div>

      <section aria-label="Billing options" className="max-w-6xl mx-auto px-5 mb-8">
        <label className="font-semibold">Billing frequency <select className="ml-2 rounded-lg border border-slate-400 p-3 bg-white" value={billingCycle} onChange={e=>setBillingCycle(e.target.value as BillingCycle)}><option value="monthly">Monthly</option><option value="annual">Annually</option></select></label>
        <p className="mt-4 text-sm text-slate-600">USD subscription prices for new purchases. Annual plans are charged in full each year. Existing subscriptions are not repriced. Client payment processing fees are separate. SMS is not included or enabled.</p>
      </section>
      {/* PRICING CARDS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">

          {/* TIER 1: Free */}
          <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm flex flex-col h-full">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Free</h3>
            <p className="text-slate-500 text-sm mb-6 h-10">Try the platform and create your first client-ready agreements.</p>
            <div className="text-5xl font-extrabold text-slate-900 mb-6">$0<span className="text-lg text-slate-500 font-medium">/mo</span></div>
            <Link href="/login" className="w-full block text-center py-4 rounded-xl border-2 border-slate-200 font-bold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all mb-8">
              Start Free
            </Link>
            <ul className="space-y-4 flex-1">
              <li className="flex items-start gap-3 text-slate-700"><CheckCircle2 className="w-5 h-5 text-slate-600 shrink-0" /> <span>First 3 contracts free</span></li>
              <li className="flex items-start gap-3 text-slate-700"><CheckCircle2 className="w-5 h-5 text-slate-600 shrink-0" /> <span>Electronic signature workflow</span></li>
              <li className="flex items-start gap-3 text-slate-700"><CheckCircle2 className="w-5 h-5 text-slate-600 shrink-0" /> <span>Preview contract and payment flow</span></li>
            </ul>
          </div>

          {/* TIER 2: Starter (Highlighted) */}
          <div className="bg-blue-50 rounded-xl p-8 border border-blue-200 shadow-sm relative overflow-hidden flex flex-col h-full">

            <h3 className="text-2xl font-bold text-slate-950 mb-2">Starter</h3>
            <p className="text-slate-600 text-sm mb-6 h-10">For solo operators who need one live client link to collect deposits.</p>
            <div className="text-5xl font-extrabold text-slate-950 mb-6">${planQuote('starter',billingCycle).monthlyEquivalent}<span className="text-lg text-slate-600 font-medium">/mo</span></div>
            <p className="text-sm mb-5">{billingCycle==='annual'?`Billed $${PLAN_PRICES.starter.annual/100} annually`:'Billed monthly'}</p>
            <button
              onClick={() => handlePricingClick('starter')}
              disabled={checkoutLoading === 'starter'}
              className="w-full block text-center py-4 rounded-xl bg-blue-600 font-bold text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/50 mb-8 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checkoutLoading === 'starter' ? 'Loading...' : 'Start Starter'}
            </button>
            <ul className="space-y-4 flex-1">
              <li className="flex items-start gap-3 text-slate-700"><CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" /> <strong>1 active client project</strong></li>
              <li className="flex items-start gap-3 text-slate-700"><CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" /> <strong>Live contract + deposit link</strong></li>
              <li className="flex items-start gap-3 text-slate-700"><CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" /> <span>AI agreement generation</span></li>
              <li className="flex items-start gap-3 text-slate-700"><CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" /> <span>Stripe payment collection</span></li>
              <li className="flex items-start gap-3 text-slate-700"><CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" /> <span>Client signing portal</span></li>
            </ul>
          </div>

          {/* TIER 3: Pro */}
          <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm flex flex-col h-full">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Professional</h3>
            <p className="text-slate-500 text-sm mb-6 h-10">For active freelancers managing multiple jobs and payment links.</p>
            <div className="text-5xl font-extrabold text-slate-900 mb-6">${planQuote('pro',billingCycle).monthlyEquivalent}<span className="text-lg text-slate-500 font-medium">/mo</span></div>
            <p className="text-sm mb-5">{billingCycle==='annual'?`Billed $${PLAN_PRICES.pro.annual/100} annually`:'Billed monthly'}</p>
            <button
              onClick={() => handlePricingClick('pro')}
              disabled={checkoutLoading === 'pro'}
              className="w-full block text-center py-4 rounded-xl border-2 border-slate-200 font-bold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all mb-8 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checkoutLoading === 'pro' ? 'Loading...' : 'Go Professional'}
            </button>

            <ul className="space-y-4 flex-1">
              <li className="flex items-start gap-3 text-slate-700"><CheckCircle2 className="w-5 h-5 text-slate-600 shrink-0" /> <span>Unlimited active projects</span></li>
              <li className="flex items-start gap-3 text-slate-700"><CheckCircle2 className="w-5 h-5 text-slate-600 shrink-0" /> <span>Automated dunning emails</span></li>
              <li className="flex items-start gap-3 text-slate-700"><CheckCircle2 className="w-5 h-5 text-slate-600 shrink-0" /> <span>Mid-project change orders</span></li>
              <li className="flex items-start gap-3 text-slate-700"><CheckCircle2 className="w-5 h-5 text-slate-600 shrink-0" /> <span>Remove watermarks</span></li>
              <li className="flex items-start gap-3 text-slate-700"><CheckCircle2 className="w-5 h-5 text-slate-600 shrink-0" /> <span>Profit and expense tracking</span></li>
            </ul>
          </div>

          <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm flex flex-col h-full">
            <h3 className="text-2xl font-bold mb-2">Agency</h3><p className="text-slate-600 text-sm mb-6">For businesses organizing client work with their team.</p>
            <div className="text-5xl font-extrabold mb-6">${planQuote('agency',billingCycle).monthlyEquivalent}<span className="text-lg font-medium text-slate-600">/mo</span></div>
            <p className="text-sm mb-5">{billingCycle==='annual'?`Billed $${PLAN_PRICES.agency.annual/100} annually`:'Billed monthly'}</p>
            <button className="w-full py-4 rounded-xl border-2 border-slate-200 font-bold mb-8" onClick={()=>handlePricingClick('agency')}>Choose Agency</button>
            <ul className="space-y-4 text-slate-700"><li>Client and project workspace</li><li>Team and access controls</li><li>Scheduling and invoice tools</li><li>Agreement and payment workflows</li></ul>
          </div>
        </div>
      </div>

      {/* Explain our workflow without unsupported competitor claims. */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Why switch to MicroFreelanceHub?</h2>
        <p className="text-slate-600 mb-6">Keep agreement details, signatures, and payment workflows in one place.</p>
        <div className="grid gap-5 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-6"><h3 className="font-semibold text-slate-900">Define the work</h3><p className="mt-3 text-sm leading-6 text-slate-600">Start with scope, price and timing. Review the agreement before sharing.</p></div>
          <div className="rounded-xl border border-slate-200 bg-white p-6"><h3 className="font-semibold text-slate-900">Review changes separately</h3><p className="mt-3 text-sm leading-6 text-slate-600">Describe additional work and its price in a separate change order referencing the original agreement.</p></div>
          <div className="rounded-xl border border-slate-200 bg-white p-6"><h3 className="font-semibold text-slate-900">Keep payment steps clear</h3><p className="mt-3 text-sm leading-6 text-slate-600">Client payment uses your connected Stripe account. Eligibility, plan limits and processing fees apply.</p></div>
        </div>
      </section>

      {/* FINAL CTA */}
      <div className="max-w-4xl mx-auto text-center px-4">
         <div className="inline-flex items-center justify-center p-4 bg-emerald-50 text-emerald-700 rounded-full mb-6">
            <ShieldCheck className="w-8 h-8" />
         </div>
         <h2 className="text-3xl font-bold text-slate-900 mb-6">Start with clearer project terms.</h2>
         <Link href="/login" className="inline-flex items-center gap-2 bg-slate-900 text-white font-bold px-8 py-4 rounded-full shadow-xl hover:bg-black transition-all hover:-translate-y-1">
            Create your free account <ArrowRight className="w-5 h-5" />
         </Link>
      </div>
    </div>
  );
}
