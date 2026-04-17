'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

// 1. We move all the actual logic into this child component
function CheckoutLogic() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();
  const plan = searchParams.get('plan') as 'pro' | 'agency' | null;

  useEffect(() => {
    const initiateCheckout = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setError('Not logged in');
          return;
        }

        if (!plan) {
          setError('No plan selected');
          return;
        }

        // Call checkout API
        const response = await fetch('/api/stripe/checkout-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan, userId: user.id }),
        });

        const data = await response.json();

        if (data.url) {
          // Redirect to Stripe checkout
          window.location.href = data.url;
        } else {
          setError(data.error || 'Failed to initiate checkout');
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Checkout error:', err);
        setError(err.message || 'An error occurred');
        setLoading(false);
      }
    };

    initiateCheckout();
  }, [plan, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-slate-600">Preparing your checkout...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Checkout Error</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <Link href="/pricing" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
            Back to Pricing
          </Link>
        </div>
      </div>
    );
  }

  return null;
}

// 2. The Parent Page wraps the logic in a Suspense boundary to make Vercel happy
export default function CheckoutPlanPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-slate-600">Loading secure checkout...</p>
        </div>
      </div>
    }>
      <CheckoutLogic />
    </Suspense>
  );
}