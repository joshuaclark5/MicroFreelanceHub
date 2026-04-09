'use client';

import { useState } from 'react';
import { Hexagon, CreditCard, CheckCircle, ArrowRight, X } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface WelcomeWizardProps {
  onComplete?: () => void;
}

export default function WelcomeWizard({ onComplete }: WelcomeWizardProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const supabase = createClientComponentClient();

  const handleNext = () => {
    setStep(step + 1);
  };

  const handleStripeConnect = () => {
    const clientId = process.env.NEXT_PUBLIC_STRIPE_CLIENT_ID;
    const redirectUri = `${window.location.origin}/api/stripe/callback`;

    if (!clientId) {
      alert("Missing Stripe Client ID");
      return;
    }

    // Store wizard state before redirect
    localStorage.setItem('fromWelcomeWizard', 'true');

    const stripeUrl = `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${clientId}&scope=read_write&redirect_uri=${redirectUri}`;
    window.location.href = stripeUrl;
  };

  const handleComplete = async () => {
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase.from('profiles').update({
        full_name: name,
        business_name: businessName,
      }).eq('id', user.id);

      if (error) throw error;

      // Set localStorage flag
      localStorage.setItem('hasCompletedWizard', 'true');
      setIsProcessing(false);
      if (onComplete) onComplete();
    } catch (err) {
      console.error('Error completing setup:', err);
      alert('Failed to save your details. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('hasCompletedWizard', 'true');
    if (onComplete) onComplete();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-indigo-500/20 overflow-hidden">

        {/* Close Button */}
        <button
          onClick={handleSkip}
          className="absolute top-6 right-6 z-10 text-slate-400 hover:text-white transition-colors duration-200"
          aria-label="Close wizard"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header with background decoration */}
        <div className="relative overflow-hidden p-8 sm:p-12 border-b border-indigo-500/20">
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
              <Hexagon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">MicroFreelanceHub</h1>
          </div>

          {/* Step Indicator */}
          <div className="relative z-10">
            <div className="flex justify-between mb-3">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-2 flex-1 mx-1 rounded-full transition-all ${
                    s <= step ? 'bg-gradient-to-r from-indigo-400 to-purple-500' : 'bg-slate-700'
                  }`}
                ></div>
              ))}
            </div>
            <p className="text-xs font-semibold text-indigo-300 uppercase tracking-widest">
              Step {step} of 3
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 sm:p-12 min-h-96">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <h2 className="text-3xl font-bold text-white mb-4">Welcome to MicroFreelanceHub! 🎉</h2>
                <div className="space-y-4">
                  <p className="text-indigo-100 text-lg leading-relaxed">
                    We're thrilled to have you on board. MicroFreelanceHub is built to{' '}
                    <span className="font-semibold text-white">automate your entire business</span> so you can focus on what matters.
                  </p>
                  <p className="text-indigo-100 text-lg leading-relaxed">
                    Here's the best part:{' '}
                    <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                      Keep 100% of your cash
                    </span>
                    . No middleman. No fees. Just pure profit.
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-400 mb-3">Let's get you set up in less than 2 minutes...</p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Connect Your Bank</h2>
                <p className="text-indigo-100 mb-8">
                  To get paid instantly from your clients, we need to connect your bank account via Stripe.
                </p>
              </div>

              <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-6 space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white">Instant Payouts</p>
                    <p className="text-sm text-indigo-200">Get paid the same day your clients pay you</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white">Secure & Trusted</p>
                    <p className="text-sm text-indigo-200">Powered by Stripe, the world's most secure payment processor</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white">The Pass-Through Fee</p>
                    <p className="text-sm text-indigo-200">We automatically pass the standard 3.9% card processing fee to your client, so you keep 100% of your principal</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Tell Us About You</h2>
                <p className="text-indigo-100 mb-6">
                  Let's personalize your dashboard with your details.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-indigo-200 mb-2">Your Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Sarah Johnson"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-indigo-200 mb-2">
                    Business Name or Job Title
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g., Web Designer & Consultant"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Actions */}
        <div className="px-8 sm:px-12 py-6 border-t border-indigo-500/20 bg-slate-800/50">
          {step === 1 && (
            <div className="flex justify-end gap-3">
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/30"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <button
                onClick={handleStripeConnect}
                className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-lg rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
              >
                <CreditCard className="w-5 h-5" /> Connect Bank/Stripe
              </button>
              <p className="text-center text-xs text-indigo-300 italic">
                Connecting Stripe allows us to automatically attach secure payment links and terms to your agreements once both parties sign.
              </p>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setStep(step - 1)}
                  className="flex-1 px-6 py-3 text-indigo-300 hover:text-indigo-100 font-bold rounded-xl transition-all"
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex gap-3">
              <button
                onClick={() => setStep(step - 1)}
                disabled={isProcessing}
                className="px-6 py-3 text-indigo-300 hover:text-indigo-100 font-bold rounded-xl transition-all disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                disabled={!name.trim() || !businessName.trim() || isProcessing}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-4 h-4" /> {isProcessing ? 'Completing...' : 'Complete Setup'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
