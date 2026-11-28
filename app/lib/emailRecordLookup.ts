// Read-only traversal of the existing authorized email snapshot. Never enqueue or retry mail.
export type EmailHistoryRecord = {
  id: string; template: string; aggregateId: string; workspaceId: string | null;
  recipient: string; status: string; attempts: number; nextAttemptAt: string | null;
  cancelRequested: boolean; createdAt: string; version: number;
};
type Snapshot = { actorId: string; records: EmailHistoryRecord[]; hasMore: boolean; nextCursor: string | null };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function* emailHistoryPages(
  actorId: string,
  signal: AbortSignal,
  request: typeof fetch = fetch,
): AsyncGenerator<EmailHistoryRecord[]> {
  if (!uuid.test(actorId)) throw new Error('Valid account and message required.');
  let cursor: string | null = null;
  const seen = new Set<string>();
  for (let page = 0; page < 100; page++) {
    signal.throwIfAborted();
    const query = new URLSearchParams({ expectedActorId: actorId });
    if (cursor) query.set('after', cursor);
    const response = await request('/api/workspace/email?' + query, { cache: 'no-store', signal });
    if (!response.ok) throw new Error(response.status === 401 || response.status === 403 || response.status === 409
      ? 'Message access unavailable. Check your signed-in account.' : 'Unable to load message. Try again.');
    const data: Snapshot = await response.json();
    signal.throwIfAborted();
    if (data.actorId !== actorId) throw new Error('Account changed. Message hidden.');
    if (!Array.isArray(data.records) || typeof data.hasMore !== 'boolean'
      || data.records.some(row => !row || typeof row.id !== 'string' || !uuid.test(row.id))) {
      throw new Error('Email history unavailable. Try again.');
    }
    yield data.records;
    if (!data.hasMore) return;
    const next = data.nextCursor;
    if (!next || !uuid.test(next) || seen.has(next.toLowerCase()) || (cursor && next.toLowerCase() <= cursor.toLowerCase())) {
      throw new Error('Email history incomplete. Try again.');
    }
    seen.add(next.toLowerCase());
    cursor = next;
  }
  // Exhausting a safety bound is not evidence that a message does not exist.
  throw new Error('Email history search limit reached. Message availability is unconfirmed.');
}

export async function findEmailRecord(actorId: string, recordId: string, signal: AbortSignal, request: typeof fetch = fetch): Promise<EmailHistoryRecord | null> {
  if (!uuid.test(recordId)) throw new Error('Valid account and message required.');
  for await (const records of emailHistoryPages(actorId, signal, request)) {
    const match = records.find(row => row.id.toLowerCase() === recordId.toLowerCase());
    if (match) return match;
  }
  return null;
}

export async function failedEmailRecords(actorId: string, signal: AbortSignal, request: typeof fetch = fetch): Promise<EmailHistoryRecord[]> {
  const rows = new Map<string, EmailHistoryRecord>();
  for await (const records of emailHistoryPages(actorId, signal, request)) {
    for (const row of records) {
      // An unknown outcome or scheduled retry is not a confirmed failure.
      if (row.status === 'failed' || row.status === 'bounced') rows.set(row.id, row);
    }
  }
  return [...rows.values()].sort((a, b) => {
    const date = (value: string) => Number.isFinite(Date.parse(value)) ? Date.parse(value) : Number.MAX_SAFE_INTEGER;
    return date(a.createdAt) - date(b.createdAt) || a.id.localeCompare(b.id);
  });
}
