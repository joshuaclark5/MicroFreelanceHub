'use client';

import React from 'react';

export default function ConnectStripeButton({ userId }: { userId: string }) {
  if (!userId) return null;

  // No OAuth URL or click handler until a reviewed, session-bound flow replaces the legacy callback.
  return (
    <div>
      <button type="button" disabled className="d4-primary w-full">
        Stripe connection unavailable
      </button>
      <p className="mt-2 text-sm">
        New Stripe connections are temporarily unavailable. Existing connection records are unchanged.
      </p>
    </div>
  );
}
