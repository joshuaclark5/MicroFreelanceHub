'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function LoginPage() {
  // 🔨 THE SLEDGEHAMMER FIX:
  // We are forcing the app to use the correct address right here.
  const supabase = createClientComponentClient({
    supabaseUrl: 'https://rjgttmwrbyjqifodjnqm.supabase.co',
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqZ3R0bXdyYnlqcWlmb2RqbnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NTMwNTksImV4cCI6MjA4NDAyOTA1OX0.dRFq0UWMVQ2fiVqAbAAaQGxCfjXZL52v1EXt4nR0vYI'
  });

  const router = useRouter();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Dynamic redirect URL for Vercel or Localhost
    const callbackUrl = `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOtp({ 
      email,
      options: {
        emailRedirectTo: callbackUrl,
      },
    });

    if (error) {
      console.error('Supabase Error:', error);
      setMessage('❌ Error sending magic link: ' + error.message);
    } else {
      setMessage('✅ Check your email for the login link!');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto py-12 px-6">
      <h1 className="text-2xl font-bold mb-4">Log In</h1>
      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          className="border px-4 py-2 w-full rounded"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded w-full font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Magic Link'}
        </button>
        {message && (
          <p className={`text-sm mt-2 p-3 rounded ${message.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
}