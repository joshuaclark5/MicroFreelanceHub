'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useSearchParams } from 'next/navigation';

// 1. The Form Logic
function LoginForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
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

  // --- GOOGLE LOGIN HANDLER ---
  const handleGoogleLogin = async () => {
    // Safely get the current website URL
    const currentDomain = typeof window !== 'undefined' ? window.location.origin : '';
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Redirects to the route we created in Step 1
        redirectTo: `${currentDomain}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    if (error) {
      console.error("Google Login Error:", error);
      setMessage('Error: ' + error.message);
    }
  };

  // --- MAGIC LINK HANDLER ---
  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // 👈 Stops the page from refreshing immediately
    setLoading(true);
    setMessage('');

    const currentDomain = typeof window !== 'undefined' ? window.location.origin : '';
    console.log("Sending magic link to:", currentDomain); // Debugging check

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // 👇 Explicitly tells Supabase: "Send them back HERE"
        emailRedirectTo: `${currentDomain}/auth/callback`,
      },
    });

    if (error) {
      console.error("Login Error:", error);
      setMessage('Error: ' + error.message);
    } else {
      setMessage('Check your email for the magic link! ✨');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-gray-100 text-center">
        {/* Dynamic Header */}
        {templateName ? (
          <div className="mb-8">
            <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide">
              Step 2 of 3
            </span>
            <h1 className="text-2xl font-bold mt-3">Customize your {templateName}</h1>
            <p className="text-gray-500 text-sm mt-2">
              Sign in to save this template to your dashboard and unlock the AI editor.
            </p>
          </div>
        ) : (
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Welcome Back</h1>
            <p className="text-gray-500 text-sm mt-2">Sign in to manage your contracts</p>
          </div>
        )}

        {message ? (
          <div className={`p-4 rounded mb-4 text-sm font-medium animate-pulse ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {message}
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* GOOGLE BUTTON */}
            <button
              onClick={handleGoogleLogin}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-all"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Sign in with Google
            </button>

            {/* DIVIDER */}
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase font-medium">Or continue with email</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            {/* MAGIC LINK FORM */}
            <form onSubmit={handleMagicLinkLogin} className="space-y-4">
              <input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                required
              />
              <button
                disabled={loading}
                className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending Link...' : 'Send Magic Link ⚡'}
              </button>
            </form>
          </div>
        )}
      </div>
  );
}

// 2. The Main Page Wrapper
export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <Suspense fallback={<div className="text-center p-4 text-gray-500">Loading secure login...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}