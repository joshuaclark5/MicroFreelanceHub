import { validId, validLocalDate } from './workspaceScheduling';

// Shared contract for the upcoming owner time-off API and review screen.
// Not connected to a route or deployed database function yet.
type Range = { startsOn: string; endsOn: string; timezone: string };
type Actor = { expectedActorId: string };
export type TimeOffRequest =
  | (Actor & Range & { action: 'preview' })
  | (Actor & Range & { action: 'create'; operationId: string; expectedReviewToken: string })
  | (Actor & { action: 'remove'; operationId: string; id: string; expectedVersion: number });

export function timeOffInput(input: unknown): TimeOffRequest {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error('Object required.');
  const b = input as Record<string, unknown>;
  const common = ['action', 'expectedActorId'];
  const range = ['startsOn', 'endsOn', 'timezone'];
  const keys = b.action === 'preview' ? [...common, ...range]
    : b.action === 'create' ? [...common, ...range, 'operationId', 'expectedReviewToken']
    : b.action === 'remove' ? [...common, 'operationId', 'id', 'expectedVersion'] : [];
  if (!keys.length || Object.keys(b).length !== keys.length || keys.some(k => !Object.prototype.hasOwnProperty.call(b, k))) {
    throw Error('Missing or unsupported fields.');
  }
  if (!validId(b.expectedActorId)) throw Error('Valid account required.');
  if (b.action !== 'preview' && (typeof b.operationId !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(b.operationId))) {
    throw Error('Valid operation required.');
  }
  if (b.action === 'remove') {
    if (!validId(b.id) || !Number.isInteger(b.expectedVersion) || Number(b.expectedVersion) < 1 || Number(b.expectedVersion) > 999999999) throw Error('Valid record and version required.');
  } else {
    if (!validLocalDate(b.startsOn) || !validLocalDate(b.endsOn) || b.endsOn < b.startsOn) throw Error('Choose valid first and last days off.');
    // Inclusive civil days, deliberately independent of DST/UTC elapsed hours.
    if ((Date.parse(b.endsOn + 'T00:00:00Z') - Date.parse(b.startsOn + 'T00:00:00Z')) / 86400000 >= 366) throw Error('Choose at most 366 days off.');
    if (typeof b.timezone !== 'string' || !b.timezone.length || b.timezone.length > 80 || b.timezone.trim() !== b.timezone) throw Error('Choose a valid timezone.');
    try { new Intl.DateTimeFormat('en', { timeZone: b.timezone }).format(); } catch { throw Error('Choose a valid timezone.'); }
    if (b.action === 'create' && (typeof b.expectedReviewToken !== 'string' || !/^[a-f0-9]{64}$/.test(b.expectedReviewToken))) throw Error('Review affected appointments before saving.');
  }
  // Copy only validated own fields; never mutate or normalize an idempotent request.
  return Object.fromEntries(keys.map(k => [k, b[k]])) as TimeOffRequest;
}
