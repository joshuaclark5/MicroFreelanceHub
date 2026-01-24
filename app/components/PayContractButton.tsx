'use client';

import { useState } from 'react';
import { CreditCard, Lock, Repeat } from 'lucide-react'; // Added Repeat icon

export default function PayContractButton({ 
  sowId, 
  price, 
  paymentType = 'one_time', // 🆕 Default to one-time
  disabled 
}: { 
  sowId: string, 
  price: number, 
  paymentType?: 'one_time' | 'monthly', // 🆕 Add Prop
  disabled?: boolean 
}) {
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    try {
      // Call our API route
      // The backend will lookup the 'payment_type' from the DB using sowId
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

  const isSubscription = paymentType === 'monthly';

  return (
    <button 
      onClick={handlePay}
      disabled={loading}
      className={`w-full font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-lg text-white ${
        isSubscription 
          ? 'bg-indigo-600 hover:bg-indigo-700' // Purple/Indigo for Subscriptions
          : 'bg-emerald-600 hover:bg-emerald-700' // Green for One-Time
      }`}
    >
      {loading ? (
        <span>Processing...</span>
      ) : (
        <>
          {isSubscription ? <Repeat className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
          
          {isSubscription 
            ? `Subscribe $${price.toLocaleString()} / mo`
            : `Pay $${price.toLocaleString()}`
          }
        </>
      )}
    </button>
  );
}