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

    localStorage.setItem('fromWelcomeWizard', 'true');

    const stripeUrl = `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${clientId}&scope=read_write&redirect_uri=${redirectUri}`;
    window.location.href = stripeUrl;
  };

  const handleComplete = async () => {
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');
      if (!user.email) throw new Error('No email found');

      const { error } = await supabase.from('profiles').update({
        full_name: name,
        business_name: businessName,
        has_completed_onboarding: true,
      }).eq('id', user.id);

      if (error) throw error;

      try {
        const emailResponse = await supabase.functions.invoke('welcome-email', {
          body: { email: user.email, name },
        });
        if (emailResponse.error) console.warn('Welcome email failed to send:', emailResponse.error);
      } catch (emailErr) {
        console.warn('Error invoking welcome-email function:', emailErr);
      }

      localStorage.removeItem('hasCompletedWizard');
      setIsProcessing(false);
      if (onComplete) onComplete();
    } catch (err) {
      console.error('Error completing setup:', err);
      alert('Failed to save your details. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleSkip = () => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase.from('profiles').update({
          has_completed_onboarding: true,
        }).eq('id', user.id);
      } catch (err) {
        console.warn('Profile update failed on skip:', err);
      }
    })();
    localStorage.removeItem('hasCompletedWizard');
    if (onComplete) onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <button
        onClick={handleSkip}
        className="absolute top-4 right-4 z-[60] p-3 rounded-full bg-slate-900/50 text-slate-300 hover:text-white hover:bg-slate-800 transition-all duration-200 border border-slate-700/50"
        aria-label="Close wizard"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto hide-scrollbar rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 shadow-2xl border border-indigo-500/20">
        
        <div className="relative overflow-hidden p-8 sm:p-12 border-b border-indigo-500/20">
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
              <Hexagon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">MicroFreelanceHub</h1>
          </div>

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

        <div className="p-8 sm:p-12 min-h-[300px]">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <h2 className="text-3xl font-bold text-white mb-6">Welcome to the Hub! 🎉</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-white">Clear Agreements</p>
                      <p className="text-sm text-indigo-200">Send agreements and handle extra work with written change orders and updated signatures.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-white">Automate Payments</p>
                      <p className="text-sm text-indigo-200">Select your terms and we automatically generate a secure pay link once both parties sign.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-white">Track Everything</p>
                      <p className="text-sm text-indigo-200">Manage all your invoicing and log your business expenses in one single place.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-white">Mega-Easy Taxes</p>
                      <p className="text-sm text-indigo-200">At the end of the year, Stripe automatically sends your 1099 for all invoices processed here.</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl">
                  <p className="text-indigo-100 text-sm leading-relaxed">
                    Your first 3 projects are <span className="font-bold text-white">free</span>. You can also choose how processing fees are shown in the client payment flow, so your pricing stays{' '}
                    <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                      easier to explain.
                    </span>
                  </p>
                </div>
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
                    <p className="text-sm text-indigo-200">Automatically pass processing fees to your client so you keep your principal cash.</p>
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
              <button
                onClick={handleNext}
                className="w-full px-6 py-3 border border-indigo-400/40 text-indigo-100 hover:text-white hover:border-indigo-300 font-bold rounded-xl transition-all"
              >
                Continue without Stripe
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
