'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { CheckCircle2, X, ShieldCheck, ArrowRight } from 'lucide-react';
import { getTrackedData } from '../lib/trackingClient';

export default function PricingPage() {
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
  const handlePricingClick = async (plan: 'starter' | 'pro') => {
    const { landing_page, lead_source } = getTrackedData();

    if (!user) {
      const loginUrl = new URL('/login', window.location.origin);
      loginUrl.searchParams.set('plan', plan);
      if (landing_page) loginUrl.searchParams.set('landing_page', landing_page);
      if (lead_source) loginUrl.searchParams.set('lead_source', lead_source);
      window.location.href = loginUrl.toString();
      return;
    }

    try {
      setCheckoutLoading(plan);
      const response = await fetch('/api/stripe/checkout-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          userId: user.id,
          landingPage: landing_page,
          leadSource: lead_source,
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Error initiating checkout: ' + data.error);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout');
    } finally {
      setCheckoutLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-slate-600">Loading pricing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 pb-24">
      {/* NAVBAR */}
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-slate-900 text-white w-8 h-8 flex items-center justify-center rounded-lg font-bold text-lg shadow-md">M</div>
            <span className="font-bold text-xl tracking-tight text-slate-900">MicroFreelance</span>
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
      <div className="max-w-3xl mx-auto text-center pt-20 pb-12 px-6">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6">
          A clearer way to start <span className="text-blue-600">client work.</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-600 leading-relaxed">
          Choose the plan that helps you outline scope, pricing, approvals, timelines, signatures, and payment steps.
        </p>
      </div>

      {/* PRICING CARDS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <div className="grid md:grid-cols-3 gap-8 items-start">
          
          {/* TIER 1: Free */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col h-full">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Free</h3>
            <p className="text-slate-500 text-sm mb-6 h-10">Try the platform and create your first client-ready agreements.</p>
            <div className="text-5xl font-extrabold text-slate-900 mb-6">$0<span className="text-lg text-slate-500 font-medium">/mo</span></div>
            <Link href="/login" className="w-full block text-center py-4 rounded-xl border-2 border-slate-200 font-bold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all mb-8">
              Start Free
            </Link>
            <ul className="space-y-4 flex-1">
              <li className="flex items-start gap-3 text-slate-700"><CheckCircle2 className="w-5 h-5 text-slate-400 shrink-0" /> <span>First 3 contracts free</span></li>
              <li className="flex items-start gap-3 text-slate-700"><CheckCircle2 className="w-5 h-5 text-slate-400 shrink-0" /> <span>ESIGN Act compliant signatures</span></li>
              <li className="flex items-start gap-3 text-slate-700"><CheckCircle2 className="w-5 h-5 text-slate-400 shrink-0" /> <span>Preview contract and payment flow</span></li>
            </ul>
          </div>

          {/* TIER 2: Starter (Highlighted) */}
          <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col h-full transform md:-translate-y-4">
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-bl-lg uppercase tracking-wider">Most Popular</div>
            <h3 className="text-2xl font-bold text-white mb-2">Starter</h3>
            <p className="text-slate-400 text-sm mb-6 h-10">For solo operators who need one live client link to collect deposits.</p>
            <div className="text-5xl font-extrabold text-white mb-6">$9<span className="text-lg text-slate-400 font-medium">/mo</span></div>
            <button
              onClick={() => handlePricingClick('starter')}
              disabled={checkoutLoading === 'starter'}
              className="w-full block text-center py-4 rounded-xl bg-blue-600 font-bold text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/50 mb-8 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checkoutLoading === 'starter' ? 'Loading...' : 'Start Starter'}
            </button>
            <ul className="space-y-4 flex-1">
              <li className="flex items-start gap-3 text-slate-200"><CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" /> <strong>1 active client project</strong></li>
              <li className="flex items-start gap-3 text-slate-200"><CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" /> <strong>Live contract + deposit link</strong></li>
              <li className="flex items-start gap-3 text-slate-200"><CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" /> <span>AI agreement generation</span></li>
              <li className="flex items-start gap-3 text-slate-200"><CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" /> <span>Stripe payment collection</span></li>
              <li className="flex items-start gap-3 text-slate-200"><CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" /> <span>Client signing portal</span></li>
            </ul>
          </div>

          {/* TIER 3: Pro */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col h-full">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Professional</h3>
            <p className="text-slate-500 text-sm mb-6 h-10">For active freelancers managing multiple jobs and payment links.</p>
            <div className="text-5xl font-extrabold text-slate-900 mb-6">$29<span className="text-lg text-slate-500 font-medium">/mo</span></div>
            <button
              onClick={() => handlePricingClick('pro')}
              disabled={checkoutLoading === 'pro'}
              className="w-full block text-center py-4 rounded-xl border-2 border-slate-200 font-bold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all mb-8 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checkoutLoading === 'pro' ? 'Loading...' : 'Go Professional'}
            </button>

            <ul className="space-y-4 flex-1">
              <li className="flex items-start gap-3 text-slate-700"><CheckCircle2 className="w-5 h-5 text-slate-400 shrink-0" /> <span>Unlimited active projects</span></li>
              <li className="flex items-start gap-3 text-slate-700"><CheckCircle2 className="w-5 h-5 text-slate-400 shrink-0" /> <span>Automated dunning emails</span></li>
              <li className="flex items-start gap-3 text-slate-700"><CheckCircle2 className="w-5 h-5 text-slate-400 shrink-0" /> <span>Mid-project change orders</span></li>
              <li className="flex items-start gap-3 text-slate-700"><CheckCircle2 className="w-5 h-5 text-slate-400 shrink-0" /> <span>Remove watermarks</span></li>
              <li className="flex items-start gap-3 text-slate-700"><CheckCircle2 className="w-5 h-5 text-slate-400 shrink-0" /> <span>Profit and expense tracking</span></li>
            </ul>
          </div>

        </div>
      </div>

      {/* COMPARISON TABLE */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Why switch to MicroFreelanceHub?</h2>
          <p className="text-slate-600">Keep agreement details, signatures, and payment workflows in one place.</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-6 font-bold text-slate-900 w-1/3">Features</th>
                  <th className="p-6 font-extrabold text-blue-600 border-x border-slate-200 bg-blue-50/30 w-1/6 text-center">MicroFreelance</th>
                  <th className="p-6 font-bold text-slate-500 w-1/6 text-center">DocuSign</th>
                  <th className="p-6 font-bold text-slate-500 w-1/6 text-center">HoneyBook</th>
                  <th className="p-6 font-bold text-slate-500 w-1/6 text-center">QuickBooks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/50">
                  <td className="p-6 text-slate-700 font-medium">Digital signature workflow</td>
                  <td className="p-6 border-x border-slate-200 bg-blue-50/10 text-center"><CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" /></td>
                  <td className="p-6 text-center"><CheckCircle2 className="w-5 h-5 text-slate-400 mx-auto" /></td>
                  <td className="p-6 text-center"><CheckCircle2 className="w-5 h-5 text-slate-400 mx-auto" /></td>
                  <td className="p-6 text-center"><X className="w-5 h-5 text-red-300 mx-auto" /></td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="p-6 text-slate-700 font-medium">Built-in Stripe Checkout</td>
                  <td className="p-6 border-x border-slate-200 bg-blue-50/10 text-center"><CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" /></td>
                  <td className="p-6 text-center"><X className="w-5 h-5 text-red-300 mx-auto" /></td>
                  <td className="p-6 text-center"><CheckCircle2 className="w-5 h-5 text-slate-400 mx-auto" /></td>
                  <td className="p-6 text-center"><CheckCircle2 className="w-5 h-5 text-slate-400 mx-auto" /></td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="p-6 text-slate-700 font-medium">Automated Dunning (Late Emails)</td>
                  <td className="p-6 border-x border-slate-200 bg-blue-50/10 text-center"><CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" /></td>
                  <td className="p-6 text-center"><X className="w-5 h-5 text-red-300 mx-auto" /></td>
                  <td className="p-6 text-center"><CheckCircle2 className="w-5 h-5 text-slate-400 mx-auto" /></td>
                  <td className="p-6 text-center"><X className="w-5 h-5 text-red-300 mx-auto" /></td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="p-6 text-slate-700 font-medium">Deposit step before work begins</td>
                  <td className="p-6 border-x border-slate-200 bg-blue-50/10 text-center"><CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" /></td>
                  <td className="p-6 text-center"><X className="w-5 h-5 text-red-300 mx-auto" /></td>
                  <td className="p-6 text-center"><X className="w-5 h-5 text-red-300 mx-auto" /></td>
                  <td className="p-6 text-center"><X className="w-5 h-5 text-red-300 mx-auto" /></td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="p-6 text-slate-900 font-bold">Average Monthly Cost</td>
                  <td className="p-6 border-x border-slate-200 bg-blue-100/50 text-center font-extrabold text-blue-700">$9-$29/mo</td>
                  <td className="p-6 text-center font-medium text-slate-500">$40/mo</td>
                  <td className="p-6 text-center font-medium text-slate-500">$39/mo</td>
                  <td className="p-6 text-center font-medium text-slate-500">$30/mo</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FINAL CTA */}
      <div className="max-w-4xl mx-auto text-center px-4">
         <div className="inline-flex items-center justify-center p-4 bg-emerald-50 text-emerald-700 rounded-full mb-6">
            <ShieldCheck className="w-8 h-8" />
         </div>
         <h2 className="text-3xl font-bold text-slate-900 mb-6">Start with clearer project terms.</h2>
         <Link href="/login" className="inline-flex items-center gap-2 bg-slate-900 text-white font-bold px-8 py-4 rounded-full shadow-xl hover:bg-black transition-all hover:-translate-y-1">
            Start Your Free Trial <ArrowRight className="w-5 h-5" />
         </Link>
      </div>
    </div>
  );
}
