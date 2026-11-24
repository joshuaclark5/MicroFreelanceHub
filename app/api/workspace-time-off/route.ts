import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { boundedJson } from '../../lib/publicBooking';
import { timeOffInput, timeOffResult } from '../../lib/workspaceTimeOff';

export const dynamic = 'force-dynamic';
const reply = (body: unknown, status = 200) => NextResponse.json(body, {
  status, headers: { 'Cache-Control': 'private, no-store', ...(status === 429 ? { 'Retry-After': '60' } : {}) },
});

// Rollout gate: do not enable before the atomic, quota-enforcing RPC and owner UI
// pass staging. The RPC is deliberately not the unrestricted local prototype.
export async function POST(request: Request) {
  if (process.env.WORKSPACE_TIME_OFF_ENABLED !== 'true') return reply({ error: 'Time-off setup is not available yet.' }, 503);
  try {
    if (new URL(request.url).search) return reply({ error: 'Unsupported request options.' }, 400);
    if (request.headers.get('origin') !== new URL(request.url).origin) return reply({ error: 'Request origin not allowed.' }, 403);
    if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') return reply({ error: 'JSON required.' }, 415);
    const cookieStore = cookies();
    const db = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { user }, error } = await db.auth.getUser();
    if (error || !user) return reply({ error: 'Sign in required. Your draft has not been submitted.' }, 401);
    let body;
    try { body = timeOffInput(await boundedJson(request, 6000)); }
    catch { return reply({ error: 'Check the dates, timezone and review details. Your draft has not been submitted.' }, 400); }
    if (body.expectedActorId !== user.id) return reply({ error: 'Account changed. Return to the original account or reload before continuing.' }, 409);
    // Required RPC protocol: enforce durable per-actor quotas for direct calls too,
    // returning expected failures as data so their counters are not rolled back.
    const { data, error: rpcError } = await db.rpc('workspace_time_off_request', { payload: body });
    if (rpcError) throw Error('Unavailable');
    if (data?.ok === false) {
      if (data.code === 'rate_limited') return reply({ error: 'Too many requests. Wait a minute, then retry the same action.' }, 429);
      if (data.code === 'review_changed') return reply({ error: 'Affected appointments changed. Review them again before saving.', code: 'review_changed' }, 409);
      if (data.code === 'conflict') return reply({ error: 'This record or operation changed. Refresh before continuing.', code: 'conflict' }, 409);
      if (data.code === 'invalid') return reply({ error: 'Check your time-off details before continuing.' }, 400);
    }
    return reply(timeOffResult(data, body, user.id));
  } catch {
    return reply({ error: 'Time-off status is unavailable. If you submitted a change, retry the same action; do not create a new request.' }, 503);
  }
}
