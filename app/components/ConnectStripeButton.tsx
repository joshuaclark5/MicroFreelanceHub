'use client';

import React from 'react';
import Link from 'next/link';

export default function ConnectStripeButton({ userId }: { userId: string }) {
  const clientId = process.env.NEXT_PUBLIC_STRIPE_CLIENT_ID?.trim();
  const handleConnect = () => {
    const redirectUri = `${window.location.origin}/api/stripe/callback`;

    if (!clientId) return;

    const stripeUrl = `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${clientId}&scope=read_write&redirect_uri=${redirectUri}&state=${userId}`;
    window.location.href = stripeUrl;
  };

  if (!userId) return null;

  if (!clientId) return <div className="space-y-3">
    <p role="status">Stripe connection setup is not available on this deployment. You can keep drafting agreements without connecting.</p>
    <button type="button" className="d4-primary w-full" disabled>Connect Stripe</button>
    <Link href="/support" className="inline-block rounded underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">Get help with payment setup</Link>
  </div>;

  return (
    <button 
      type="button"
      onClick={handleConnect} 
      className="d4-primary w-full"
    >
      Connect Stripe
    </button>
  );
}
