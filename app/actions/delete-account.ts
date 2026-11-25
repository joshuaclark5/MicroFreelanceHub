'use server';

// Temporary fail-closed hold: a read-only billing preflight cannot prevent a
// concurrent checkout from creating a subscription after the check. Keep this
// action callable for stale clients, but never delete records until the full
// billing/deletion lifecycle has a durable concurrency guard.
export async function deleteUserAccount() {
  return {
    success: false,
    error: 'Self-service account deletion is temporarily unavailable. Contact admin@microfreelancehub.com to request deletion. Manage your subscription separately in Settings > Billing & Subscription.',
  };
}
