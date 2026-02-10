'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Star, ShieldCheck, ArrowRight } from 'lucide-react';

// --- 1. The Form Component ---
function LoginForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const supabase = createClientComponentClient();
  const searchParams = useSearchParams();
  
  // Get the template name from the URL
  const templateSlug = searchParams.get('template');
  
  // Format it nicely
  const templateName = templateSlug 
    ? templateSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') 
    : null;

  useEffect(() => {
    if (templateSlug) {
      localStorage.setItem('pending_template', templateSlug);
    }
  }, [templateSlug]);

  // --- GOOGLE LOGIN HANDLER (FIXED) ---
  const handleGoogleLogin = async () => {
    const currentDomain = typeof window !== 'undefined' ? window.location.origin : '';
    
    // 🧠 SMART REDIRECT FIX:
    // We build a URL that explicitly includes the template ID
    const redirectUrl = new URL(`${currentDomain}/auth/callback`);
    if (templateSlug) {
      redirectUrl.searchParams.set('template', templateSlug);
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl.toString(), // ✅ Pass the smart URL here
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

  // --- MAGIC LINK HANDLER (FIXED) ---
  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setLoading(true);
    setMessage('');
    setIsSuccess(false);

    const currentDomain = typeof window !== 'undefined' ? window.location.origin : '';

    // 🧠 SMART REDIRECT FIX:
    // Same logic for email links
    const redirectUrl = new URL(`${currentDomain}/auth/callback`);
    if (templateSlug) {
      redirectUrl.searchParams.set('template', templateSlug);
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl.toString(), // ✅ Pass the smart URL here
      },
    });

    if (error) {
      setMessage(error.message);
      setIsSuccess(false);
    } else {
      setMessage('Check your email! We sent you a secure magic link.');
      setIsSuccess(true);
      setEmail(''); // Clear field
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-8">
        
        {/* HEADER: Context Aware */}
        <div className="text-center">
            {templateName ? (
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
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome Back</h1>
                    <p className="mt-3 text-slate-500 text-sm">
                        Sign in to manage your contracts and clients.
                    </p>
                </>
            )}
        </div>

        {/* ALERTS */}
        {message && (
          <div className={`p-4 rounded-xl text-sm font-medium flex items-start gap-3 ${
              isSuccess ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
              {isSuccess ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : null}
              <p>{message}</p>
          </div>
        )}

        <div className="space-y-4">
            
            {/* GOOGLE BUTTON */}
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

            {/* DIVIDER */}
            <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-xs uppercase font-bold tracking-wider">Or</span>
                <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* MAGIC LINK FORM */}
            <form onSubmit={handleMagicLinkLogin} className="space-y-4">
                <div>
                    <label htmlFor="email" className="sr-only">Email address</label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full rounded-xl border-slate-200 bg-slate-50 p-3.5 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-sm font-medium"
                        required
                    />
                </div>
                <button
                    disabled={loading}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <span>Sending Link...</span>
                    ) : (
                        <>
                            Send Magic Link <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>
            </form>
        </div>
        
        <p className="text-center text-xs text-slate-400">
            By clicking continue, you agree to our <Link href="/terms-of-service" className="underline hover:text-slate-600">Terms</Link> and <Link href="/privacy-policy" className="underline hover:text-slate-600">Privacy Policy</Link>.
        </p>
    </div>
  );
}

// --- 2. The Main Layout (Split Screen) ---
export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white flex">
      
      {/* LEFT SIDE: Branding (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 text-white flex-col justify-between p-16 overflow-hidden">
         {/* Background Pattern */}
         <div className="absolute inset-0 opacity-10" 
              style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}>
         </div>
         
         {/* Gradient Orb */}
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/30 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
         
         <div className="relative z-10">
            <Link href="/" className="text-2xl font-bold tracking-tight flex items-center gap-2">
               <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-white" />
               </div>
               MicroFreelanceHub
            </Link>
         </div>

         <div className="relative z-10 max-w-lg">
            <div className="flex gap-1 mb-6">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />)}
            </div>
            <h2 className="text-4xl font-bold leading-tight mb-6">
                "This tool saved me from a $2,000 scope creep nightmare. Every freelancer needs this."
            </h2>
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center font-bold text-lg">JS</div>
               <div>
                  <div className="font-bold">Joshua S.</div>
                  <div className="text-slate-400 text-sm">Freelance Web Developer</div>
               </div>
            </div>
         </div>

         <div className="relative z-10 flex gap-8 text-sm text-slate-400">
            <div className="flex items-center gap-2">
               <CheckCircle2 className="w-4 h-4 text-blue-500" /> Free Forever Plan
            </div>
            <div className="flex items-center gap-2">
               <CheckCircle2 className="w-4 h-4 text-blue-500" /> No Credit Card Required
            </div>
         </div>
      </div>

      {/* RIGHT SIDE: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative">
         <div className="absolute top-6 right-6 lg:top-12 lg:right-12">
            <Link href="/" className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
               Back to Home
            </Link>
         </div>

         <Suspense fallback={<div className="text-center p-4 text-slate-500 animate-pulse">Loading secure login...</div>}>
            <LoginForm />
         </Suspense>
      </div>

    </div>
  );
}