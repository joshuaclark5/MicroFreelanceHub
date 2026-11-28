'use client';

import React, {useState} from 'react';
import Link from 'next/link';

export default function ConnectStripeButton({ userId }: { userId: string }) {
  const clientId = process.env.NEXT_PUBLIC_STRIPE_CLIENT_ID?.trim();
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const handleConnect = async () => {
    if (!clientId||busy) return;
    setBusy(true);setError('');
    try {
      const response=await fetch('/api/stripe/connect',{method:'POST'}),body=await response.json();
      if(!response.ok)throw Error(body.error||'Connection setup is unavailable.');
      const target=new URL(body.url);
      if(target.origin!=='https://connect.stripe.com'||target.pathname!=='/oauth/authorize')throw Error('Connection address is unavailable.');
      window.location.assign(target.href);
    } catch(e){setError(e instanceof Error?e.message:'Connection setup is unavailable.');setBusy(false);}
  };

  if (!userId) return null;

  if (!clientId) return <div className="space-y-3">
    <p role="status">Stripe connection setup is not available on this deployment. You can keep drafting agreements without connecting.</p>
    <button type="button" className="d4-primary w-full" disabled>Connect Stripe</button>
    <Link href="/support" className="inline-block rounded underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">Get help with payment setup</Link>
  </div>;

  return (
    <div><button
      type="button"
      onClick={handleConnect}
      className="d4-primary w-full"
      disabled={busy}
    >
      {busy?'Starting connection...':'Connect Stripe'}
    </button>
    {error&&<p role="alert" className="mt-3">{error}</p>}</div>
  );
}
