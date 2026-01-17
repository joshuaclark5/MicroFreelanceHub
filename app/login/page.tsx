'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '../supabaseClient';

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithOtp({ email });

    if (error) {
      setMessage('❌ Error sending magic link: ' + error.message);
    } else {
      setMessage('✅ Check your email for the login link!');
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-6">
      <h1 className="text-2xl font-bold mb-4">Log In</h1>
      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          className="border px-4 py-2 w-full"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded w-full"
        >
          Send Magic Link
        </button>
        {message && <p className="text-sm mt-2">{message}</p>}
      </form>
    </div>
  );
}
