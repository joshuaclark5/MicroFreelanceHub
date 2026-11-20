import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// Public diagnostics must not read credentials or make provider requests.
export async function GET() {
  return NextResponse.json(
    { error: 'debug_unavailable', message: 'This diagnostic endpoint is unavailable.' },
    { status: 503, headers: { 'Cache-Control': 'no-store' } }
  );
}
