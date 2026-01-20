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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // 👈 Stops the page from refreshing immediately
    setLoading(true);
    setMessage('');

    // Safely get the current website URL
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
          <form onSubmit={handleLogin} className="space-y-4">
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