'use client';

import { useState } from 'react';
import { CreditCard, Lock } from 'lucide-react';

export default function PayContractButton({ sowId, price, disabled }: { sowId: string, price: number, disabled?: boolean }) {
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    try {
      // Call our new API route
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sowId }),
      });

      const data = await res.json();

      if (data.url) {
        // Redirect to Stripe
        window.location.href = data.url;
      } else {
        alert(data.error || 'Payment failed to initialize');
      }
    } catch (err) {
      console.error(err);
      alert('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (disabled) {
     return (
        <button disabled className="w-full bg-gray-100 text-gray-400 font-bold py-4 rounded-xl cursor-not-allowed flex items-center justify-center gap-2">
           <Lock className="w-4 h-4" /> Payment Disabled
        </button>
     )
  }

  return (
    <button 
      onClick={handlePay}
      disabled={loading}
      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-lg"
    >
      {loading ? (
        <span>Processing...</span>
      ) : (
        <>
          <CreditCard className="w-5 h-5" />
          Pay ${price.toLocaleString()}
        </>
      )}
    </button>
  );
}