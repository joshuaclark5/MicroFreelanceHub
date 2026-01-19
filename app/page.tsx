'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      // 🛡️ Safe: This runs in the browser, where cookie access is allowed
      const supabase = createClientComponentClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // If logged in, go to Dashboard
        router.push('/dashboard');
      } else {
        // If not, show the page
        setLoading(false);
      }
    };
    
    checkUser();
  }, [router]);

  // Prevent flash of content while checking auth
  if (loading) {
    return <div className="min-h-screen bg-slate-900" />; 
  }

  // 2. If NOT logged in, show the Welcome Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col justify-center items-center text-white p-4">
      <div className="max-w-md w-full text-center space-y-8">
        
        {/* Logo / Icon */}
        <div className="mx-auto w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl transform -rotate-6">
          <span className="text-4xl">⚡</span>
        </div>

        {/* Headlines */}
        <h1 className="text-4xl font-extrabold tracking-tight">
          MicroFreelanceHub
        </h1>
        <p className="text-slate-400 text-lg">
          Create professional Scopes of Work in seconds, get them signed, and get paid.
        </p>

        {/* Buttons */}
        <div className="space-y-4 pt-4">
          <Link 
            href="/login" 
            className="block w-full py-4 px-6 bg-white text-slate-900 font-bold rounded-lg shadow-lg hover:bg-gray-100 transition-transform transform hover:-translate-y-1"
          >
            Log In to Your Dashboard
          </Link>
          
          <p className="text-sm text-slate-500">
            Don't have an account? <Link href="/login" className="text-blue-400 hover:underline">Sign up here</Link>
          </p>
        </div>

      </div>
    </div>
  );
}