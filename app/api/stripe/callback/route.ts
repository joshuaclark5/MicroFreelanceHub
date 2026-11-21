import { NextResponse } from 'next/server';

// Containment only: the legacy state=userId flow is not an authorization boundary.
// Do not exchange codes or change existing payout bindings here. See RELEASE_CONTAINMENT.md.
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    {
      error: 'stripe_connect_unavailable',
      message: 'New Stripe connections are unavailable. Existing connection records have not been changed.',
    },
    { status: 503, headers: { 'Cache-Control': 'no-store' } }
  );
}
