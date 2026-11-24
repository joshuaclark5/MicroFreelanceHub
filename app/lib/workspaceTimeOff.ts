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

// Project only the documented owner-visible fields; never forward raw RPC data.
export function timeOffResult(value: unknown, request: TimeOffRequest, actorId: string) {
  const object = (v: unknown): Record<string, unknown> => {
    if (!v || typeof v !== 'object' || Array.isArray(v)) throw Error('Invalid response.');
    return v as Record<string, unknown>;
  };
  const instant = (v: unknown): string => {
    if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(v) || !Number.isFinite(Date.parse(v))) throw Error('Invalid time.');
    return v;
  };
  const positive = (v: unknown) => {
    if (!Number.isSafeInteger(v) || Number(v) < 1) throw Error('Invalid version.');
    return v as number;
  };
  const result = object(value);
  if (result.ok !== true || result.actorId !== actorId) throw Error('Invalid account response.');
  if (request.action === 'preview') {
    const p = object(result.preview);
    if (typeof p.reviewToken !== 'string' || !/^[a-f0-9]{64}$/.test(p.reviewToken) || !Array.isArray(p.affectedBookings) || p.affectedBookings.length > 500) throw Error('Incomplete review.');
    const ids = new Set<string>();
    const affectedBookings = p.affectedBookings.map(value => {
      const b = object(value);
      if (!validId(b.id) || ids.has(b.id) || typeof b.attendee !== 'string' || b.attendee.length > 160 || typeof b.timezone !== 'string' || b.timezone.length > 80) throw Error('Invalid appointment.');
      new Intl.DateTimeFormat('en', { timeZone: b.timezone }).format();
      if (Date.parse(instant(b.ends_at)) <= Date.parse(instant(b.starts_at))) throw Error('Invalid appointment interval.');
      ids.add(b.id);
      return { id: b.id, version: positive(b.version), attendee: b.attendee, timezone: b.timezone, starts_at: instant(b.starts_at), ends_at: instant(b.ends_at) };
    });
    if (Date.parse(instant(p.endsAt)) <= Date.parse(instant(p.startsAt))) throw Error('Invalid review interval.');
    return { actorId, preview: { startsAt: instant(p.startsAt), endsAt: instant(p.endsAt), reviewToken: p.reviewToken, affectedBookings } };
  }
  const r = object(result.record);
  if (typeof result.replayed !== 'boolean' || !validId(r.id) || r.owner_id !== actorId || typeof r.active !== 'boolean') throw Error('Invalid record.');
  const range = timeOffInput({ action: 'preview', expectedActorId: actorId, startsOn: r.starts_on, endsOn: r.ends_on, timezone: r.timezone });
  if (range.action !== 'preview' || Date.parse(instant(r.ends_at)) <= Date.parse(instant(r.starts_at))) throw Error('Invalid record interval.');
  if (request.action === 'remove' && (r.id !== request.id || r.active !== false || r.version !== request.expectedVersion + 1)) throw Error('Wrong removal receipt.');
  if (request.action === 'create' && (range.startsOn !== request.startsOn || range.endsOn !== request.endsOn || range.timezone !== request.timezone || r.active !== true || r.version !== 1)) throw Error('Wrong creation receipt.');
  return { actorId, replayed: result.replayed, record: { id: r.id, starts_on: range.startsOn, ends_on: range.endsOn, timezone: range.timezone, starts_at: instant(r.starts_at), ends_at: instant(r.ends_at), active: r.active, version: positive(r.version) } };
}
