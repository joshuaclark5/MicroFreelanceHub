// Read-only traversal of the existing authorized email snapshot. Never enqueue or retry mail.
export type EmailHistoryRecord = {
  id: string; template: string; aggregateId: string; workspaceId: string | null;
  recipient: string; status: string; attempts: number; nextAttemptAt: string | null;
  cancelRequested: boolean; createdAt: string; version: number;
};
type Snapshot = { actorId: string; records: EmailHistoryRecord[]; hasMore: boolean; nextCursor: string | null };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function findEmailRecord(
  actorId: string,
  recordId: string,
  signal: AbortSignal,
  request: typeof fetch = fetch,
): Promise<EmailHistoryRecord | null> {
  if (!uuid.test(actorId) || !uuid.test(recordId)) throw new Error('Valid account and message required.');
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
    const match = data.records.find(row => row.id.toLowerCase() === recordId.toLowerCase());
    if (match) return match;
    if (!data.hasMore) return null;
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
