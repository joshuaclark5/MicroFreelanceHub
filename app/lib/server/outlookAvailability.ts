import 'server-only';

// Development adapter only: no routes, credentials, OAuth grants or schedules
// enable this module. A caller must publish only a complete successful snapshot.
const endpoint = 'https://graph.microsoft.com/v1.0/me/calendarView';
export class OutlookAvailabilityError extends Error {
  constructor(public code: string) { super(code); }
}
type Busy = { start: string; end: string };

function utcInstant(value: unknown): number {
  if (!value || typeof value !== 'object') throw new OutlookAvailabilityError('invalid_snapshot');
  const { dateTime, timeZone } = value as Record<string, unknown>;
  if (timeZone !== 'UTC' || typeof dateTime !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,7})?Z?$/.test(dateTime)) {
    throw new OutlookAvailabilityError('invalid_snapshot');
  }
  const instant = Date.parse(dateTime.endsWith('Z') ? dateTime : dateTime + 'Z');
  if (!Number.isFinite(instant) || new Date(instant).toISOString().slice(0, 19) !== dateTime.slice(0, 19)) {
    throw new OutlookAvailabilityError('invalid_snapshot');
  }
  return instant;
}

async function readPage(response: Response): Promise<any> {
  if (!response.ok) throw new OutlookAvailabilityError(
    response.status === 401 ? 'reconnect' : response.status === 403 ? 'permission_required' :
    response.status === 429 ? 'rate_limited' : 'provider_unavailable');
  if (!response.body) throw new OutlookAvailabilityError('invalid_snapshot');
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > 1024 * 1024) {
        await reader.cancel();
        throw new OutlookAvailabilityError('snapshot_too_large');
      }
      chunks.push(part.value);
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch (error) {
    if (error instanceof OutlookAvailabilityError) throw error;
    throw new OutlookAvailabilityError('invalid_snapshot');
  } finally { reader.releaseLock(); }
}

/** Read expanded instances from the primary calendar; return timestamps only.
 * Unknown availability blocks time conservatively. No partial results escape.
 * No automatic retries: caller owns throttling and account/generation fencing.
 */
export async function outlookAvailability(token: string, start: string, end: string,
  fetcher: typeof fetch = fetch): Promise<Busy[]> {
  const lo = Date.parse(start), hi = Date.parse(end);
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || hi <= lo || hi - lo > 31 * 86400000) {
    throw new OutlookAvailabilityError('invalid_window');
  }
  if (!token || /[\r\n]/.test(token)) throw new OutlookAvailabilityError('credential_unavailable');
  const url = new URL(endpoint);
  url.search = new URLSearchParams({ startDateTime: new Date(lo).toISOString(), endDateTime: new Date(hi).toISOString(),
    '$select': 'start,end,showAs,isCancelled', '$top': '100' }).toString();
  let next: string | null = url.href;
  const visited = new Set<string>(), busy: Busy[] = [];
  let count = 0;
  // One deadline across all pages; a timeout never yields an empty/partial snapshot.
  const signal = AbortSignal.timeout(15000);
  while (next) {
    let pageUrl: URL;
    try { pageUrl = new URL(next); }
    catch { throw new OutlookAvailabilityError('invalid_pagination'); }
    if (pageUrl.origin !== 'https://graph.microsoft.com' || pageUrl.pathname !== '/v1.0/me/calendarView' ||
        pageUrl.username || pageUrl.password || pageUrl.hash || visited.has(pageUrl.href) || visited.size >= 20) {
      throw new OutlookAvailabilityError('invalid_pagination');
    }
    visited.add(pageUrl.href);
    let response: Response;
    try {
      response = await fetcher(pageUrl.href, { method: 'GET', redirect: 'error', cache: 'no-store', signal,
        headers: { Authorization: 'Bearer ' + token, Prefer: 'outlook.timezone="UTC"' } });
    } catch { throw new OutlookAvailabilityError('provider_uncertain'); }
    const page = await readPage(response);
    if (!page || !Array.isArray(page.value)) throw new OutlookAvailabilityError('invalid_snapshot');
    count += page.value.length;
    if (count > 2000) throw new OutlookAvailabilityError('snapshot_too_large');
    for (const event of page.value) {
      if (!event || typeof event.isCancelled !== 'boolean' || typeof event.showAs !== 'string') {
        throw new OutlookAvailabilityError('invalid_snapshot');
      }
      if (event.isCancelled || event.showAs === 'free') continue;
      const from = utcInstant(event.start), to = utcInstant(event.end);
      if (to <= from) throw new OutlookAvailabilityError('invalid_snapshot');
      if (from < hi && to > lo) busy.push({ start: new Date(Math.max(from, lo)).toISOString(), end: new Date(Math.min(to, hi)).toISOString() });
    }
    const link = page['@odata.nextLink'];
    if (link !== undefined && (typeof link !== 'string' || !link.startsWith('https://'))) {
      throw new OutlookAvailabilityError('invalid_pagination');
    }
    next = link ?? null;
  }
  return busy.sort((a, b) => a.start.localeCompare(b.start));
}
