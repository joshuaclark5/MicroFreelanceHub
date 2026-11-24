import { agreementContext } from './agreementContext';
import { DRAFT_KEY } from './agreementDraft';

export type HandoffContext = Awaited<ReturnType<typeof agreementContext>> & { ownerId: string };
export function briefStorageKey(context?: HandoffContext | null) {
  return context ? `mfh-brief-${context.ownerId}-${context.projectId}-${context.clientId}` : 'mfh-agreement-brief-v1';
}
export function clearAgreementDraft(storage: Pick<Storage, 'removeItem'>, context?: HandoffContext | null) {
  storage.removeItem(briefStorageKey(context));
  if (!context) storage.removeItem(DRAFT_KEY);
}
// Verify the live identity again after the asynchronous ownership queries.
export async function validateHandoff(db: any, context: HandoffContext) {
  const readOwner = async () => {
    const { data, error } = await db.auth.getUser();
    if (error || data?.user?.id !== context.ownerId) throw Error('Account changed');
  };
  await readOwner();
  const current = await agreementContext(db, context.ownerId, context.projectId);
  if (current.clientId !== context.clientId) throw Error('Client changed');
  await readOwner();
}
