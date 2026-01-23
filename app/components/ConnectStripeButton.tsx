'use client';

import React from 'react';

export default function ConnectStripeButton({ userId }: { userId: string }) {
  const handleConnect = () => {
    const clientId = process.env.NEXT_PUBLIC_STRIPE_CLIENT_ID;
    const redirectUri = `${window.location.origin}/api/stripe/callback`;

    if (!clientId) {
      alert("Missing Stripe Client ID");
      return;
    }

    const stripeUrl = `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${clientId}&scope=read_write&redirect_uri=${redirectUri}&state=${userId}`;
    window.location.href = stripeUrl;
  };

  if (!userId) return null;

  return (
    <button 
      onClick={handleConnect} 
      className="w-full bg-black hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
    >
      Setup Payouts
    </button>
  );
}