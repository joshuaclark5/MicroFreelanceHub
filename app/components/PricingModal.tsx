'use client';

import { Check, Star, X, Zap } from 'lucide-react';
import { useState } from 'react';
import { getTrackedData } from '../lib/trackingClient';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export default function PricingModal({ isOpen, onClose, userId }: PricingModalProps) {
  const [loadingPlan, setLoadingPlan] = useState<'starter' | 'pro' | null>(null);

  if (!isOpen) return null;

  const handleUpgrade = async (plan: 'starter' | 'pro') => {
    try {
      setLoadingPlan(plan);
      const { landing_page, lead_source } = getTrackedData();
      const response = await fetch('/api/stripe/checkout-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          userId,
          landingPage: landing_page,
          leadSource: lead_source,
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to start checkout');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        <div className="bg-slate-900 p-6 sm:p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-indigo-500" />
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl" />

          <div className="relative z-10">
            <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-xl mb-4 backdrop-blur-md shadow-inner border border-white/10">
              <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
            </div>
            <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Unlock the Client Link</h2>
            <p className="text-slate-400 text-sm">Generate the agreement, collect the deposit, and send one secure link.</p>
          </div>

          <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
          <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-5">
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Best first step</p>
              <h3 className="mt-1 text-2xl font-extrabold text-slate-900">Starter</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900">$9</span>
                <span className="font-medium text-slate-500">/mo</span>
              </div>
            </div>
            <div className="space-y-3 mb-5">
              <FeatureItem text="1 active client project" />
              <FeatureItem text="Live contract + deposit link" />
              <FeatureItem text="AI agreement generation" />
              <FeatureItem text="Stripe payment collection" />
            </div>
            <button
              onClick={() => handleUpgrade('starter')}
              disabled={loadingPlan !== null}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-wait text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group"
            >
              <Zap className="w-5 h-5 text-blue-100 group-hover:scale-110 transition-transform" />
              {loadingPlan === 'starter' ? 'Loading...' : 'Start Starter'}
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 p-5">
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">For more jobs</p>
              <h3 className="mt-1 text-2xl font-extrabold text-slate-900">Professional</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900">$29</span>
                <span className="font-medium text-slate-500">/mo</span>
              </div>
            </div>
            <div className="space-y-3 mb-5">
              <FeatureItem text="Unlimited active projects" />
              <FeatureItem text="Automated dunning emails" />
              <FeatureItem text="Mid-project change orders" />
              <FeatureItem text="Remove watermarks" />
            </div>
            <button
              onClick={() => handleUpgrade('pro')}
              disabled={loadingPlan !== null}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 disabled:cursor-wait text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group"
            >
              <Zap className="w-5 h-5 text-yellow-400 group-hover:scale-110 transition-transform" />
              {loadingPlan === 'pro' ? 'Loading...' : 'Go Professional'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-5 h-5 rounded-full bg-white text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
        <Check className="w-3.5 h-3.5 stroke-[3]" />
      </div>
      <span className="text-slate-600 font-medium text-sm">{text}</span>
    </div>
  );
}
