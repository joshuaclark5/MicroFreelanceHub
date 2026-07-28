'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle2, ArrowRight, LockKeyhole, Mail } from 'lucide-react';
import { getTrackedData } from '../lib/trackingClient';

function LoginForm() {
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [authMode, setAuthMode] = useState<'signup' | 'signin'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const supabase = createClientComponentClient();
  const searchParams = useSearchParams();

  const templateSlug = searchParams.get('template');
  const plan = searchParams.get('plan') as 'starter' | 'pro' | 'agency' | null;
  const mode = searchParams.get('mode');
  const landingPageParam = searchParams.get('landing_page');
  const leadSourceParam = searchParams.get('lead_source');
  const planName = plan === 'starter' ? 'Starter' : plan === 'pro' ? 'Professional' : 'Agency';

  useEffect(() => {
    if (mode === 'signin') {
      setAuthMode('signin');
    }
  }, [mode]);

  const templateName = templateSlug
    ? templateSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    : null;

  useEffect(() => {
    if (templateSlug) {
      localStorage.setItem('pending_template', templateSlug);
    }
    if (plan) {
      localStorage.setItem('pending_plan', plan);
    }
  }, [templateSlug, plan]);

  const handleGoogleLogin = async () => {
    const currentDomain = typeof window !== 'undefined' ? window.location.origin : '';

    const redirectUrl = new URL(`${currentDomain}/auth/callback`);
    if (templateSlug) {
      redirectUrl.searchParams.set('template', templateSlug);
    }
    if (plan) {
      redirectUrl.searchParams.set('plan', plan);
    }

    // Add tracked landing page and marketing source
    const { landing_page, lead_source } = getTrackedData();
    const landingPage = landingPageParam || landing_page;
    const leadSource = leadSourceParam || lead_source;
    if (landingPage) {
      redirectUrl.searchParams.set('landing_page', landingPage);
    }
    if (leadSource) {
      redirectUrl.searchParams.set('lead_source', leadSource);
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl.toString(),
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    if (error) {
      console.error("Google Login Error:", error);
      setMessage('Error: ' + error.message);
      setIsSuccess(false);
    }
  };

  const getPostAuthPath = () => {
    const params = new URLSearchParams();
    if (templateSlug) params.set('template', templateSlug);
    if (landingPageParam) params.set('landing_page', landingPageParam);
    if (leadSourceParam) params.set('lead_source', leadSourceParam);

    if (plan) {
      params.set('plan', plan);
      return `/checkout-plan?${params.toString()}`;
    }

    return params.toString() ? `/signup-success?${params.toString()}` : '/dashboard';
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setAuthLoading(true);

    try {
      const callbackUrl = new URL('/auth/callback', window.location.origin);
      if (plan) callbackUrl.searchParams.set('plan', plan);
      if (templateSlug) callbackUrl.searchParams.set('template', templateSlug);
      if (landingPageParam) callbackUrl.searchParams.set('landing_page', landingPageParam);
      if (leadSourceParam) callbackUrl.searchParams.set('lead_source', leadSourceParam);
      const redirectTo = callbackUrl.toString();

      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectTo,
          },
        });

        if (error) throw error;

        if (data.session) {
          window.location.href = getPostAuthPath();
          return;
        }

        setIsSuccess(true);
        setMessage('Check your email to confirm your account, then we will continue your checkout.');
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      window.location.href = getPostAuthPath();
    } catch (error: any) {
      setIsSuccess(false);
      setMessage(error.message || 'Authentication failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setIsSuccess(false);
      setMessage('Enter your email first, then request a password reset.');
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });

    if (error) {
      setIsSuccess(false);
      setMessage(error.message);
      return;
    }

    setIsSuccess(true);
    setMessage('Password reset email sent.');
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-8">

        {/* Logo at top of card */}
        <div className="flex justify-center">
          <Image src="/icon.svg" alt="MicroFreelanceHub" width={64} height={64} />
        </div>

        <div className="text-center">
            {plan ? (
                <>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wide mb-4 border border-blue-100">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        {templateSlug ? 'Step 3 of 3: Upgrade' : 'Step 2 of 2: Upgrade'}
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        Upgrade to <span className="text-blue-600">{planName}</span>
                    </h1>
                    <p className="mt-3 text-slate-500 text-sm leading-relaxed">
                        Create an account or sign in to continue with your {planName} plan purchase.
                    </p>
                </>
            ) : templateName ? (
                <>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wide mb-4 border border-blue-100">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        Step 2 of 3: Secure Account
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        Save your <span className="text-blue-600">{templateName}</span>
                    </h1>
                    <p className="mt-3 text-slate-500 text-sm leading-relaxed">
                        Create a free account to unlock the AI editor, customize your terms, and download the PDF.
                    </p>
                </>
            ) : (
                <>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        {authMode === 'signup' ? 'Create your free account' : 'Welcome Back'}
                    </h1>
                    <p className="mt-3 text-slate-500 text-sm">
                        {authMode === 'signup'
                          ? 'Save your agreements, send client links, and manage deposits from one dashboard.'
                          : 'Sign in to manage your contracts and clients.'}
                    </p>
                </>
            )}
        </div>

        {message && (
          <div className={`p-4 rounded-xl text-sm font-medium flex items-start gap-3 ${
              isSuccess ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
              {isSuccess ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : null}
              <p>{message}</p>
          </div>
        )}

        <div className="space-y-4">
            <button
                onClick={handleGoogleLogin}
                className="group relative w-full flex items-center justify-center gap-3 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-3.5 px-4 rounded-xl transition-all shadow-sm hover:shadow-md"
            >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span>Continue with Google</span>
            </button>

            <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center">
                    <span className="bg-white px-3 text-xs font-bold uppercase tracking-wider text-slate-400">or use email</span>
                </div>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-3">
                <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email address"
                        className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                </div>

                <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        type="password"
                        required
                        minLength={8}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                </div>

                <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full rounded-xl bg-slate-900 py-3.5 font-bold text-white shadow-sm transition hover:bg-black disabled:cursor-wait disabled:bg-slate-500"
                >
                    {authLoading ? 'Working...' : authMode === 'signup' ? 'Create account' : 'Sign in'}
                </button>
            </form>

            <div className="flex items-center justify-between gap-3 text-xs font-semibold">
                <button
                    type="button"
                    onClick={() => {
                      setAuthMode(authMode === 'signup' ? 'signin' : 'signup');
                      setMessage('');
                    }}
                    className="text-blue-600 hover:text-blue-700"
                >
                    {authMode === 'signup' ? 'Already have an account?' : 'Need an account?'}
                </button>
                {authMode === 'signin' && (
                    <button type="button" onClick={handlePasswordReset} className="text-slate-500 hover:text-slate-700">
                        Forgot password?
                    </button>
                )}
            </div>
        </div>
        
        <p className="text-center text-xs text-slate-400">
            By clicking continue, you agree to our <Link href="/terms-of-service" className="underline hover:text-slate-600">Terms</Link> and <Link href="/privacy-policy" className="underline hover:text-slate-600">Privacy Policy</Link>.
        </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 sm:p-6">
      {/* Back to Home Link */}
      <div className="absolute top-6 right-6 sm:top-8 sm:right-8">
         <Link href="/" className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
            Back to Home
         </Link>
      </div>

      {/* Login Form Card */}
      <div className="w-full max-w-md">
         <Suspense fallback={<div className="text-center p-4 text-slate-500 animate-pulse">Loading secure login...</div>}>
            <LoginForm />
         </Suspense>
      </div>

      {/* Benefits Footer */}
      <div className="mt-12 sm:mt-16 flex flex-col sm:flex-row gap-6 sm:gap-8 text-sm text-slate-600">
         <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> 
            <span>Free 3-Contract Plan</span>
         </div>
         <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> 
            <span>No Credit Card Required</span>
         </div>
      </div>
    </div>
  );
}
