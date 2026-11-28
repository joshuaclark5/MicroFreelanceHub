# Subscription lifecycle candidate (AD-06 / AD-09)

Not released. Migration 20261128030000 is installed on staging lfzaivnvoyvdmvvijnoq only. Production remains PR78 without this migration. Staging rehearsal, backup restore, rollback and independent-backend concurrency receipts are saved in the local artifacts directory.

## Scope

Current authenticated provider state controls the existing `profiles.is_pro` flag. `active` with a verified paid latest invoice newly grants; active alone is insufficient; `canceled`, `unpaid`, `incomplete_expired` remove access; `past_due`, `trialing`, `paused`, `incomplete` preserve the prior flag and do not newly grant. Scheduling cancellation does not end an active subscription early. No plan price, customer subscription or payout changes are requested by this code.

Platform live events only can reconcile MFH access. Test events and connected-account subscription events cannot grant MFH production access. Existing agreement-payment receipt handling remains separate. New subscription identities must carry an approved plan label; already-linked legacy subscriptions retain their identity and product rather than being migrated.

Event identity deduplicates handler retries; invoice identity deduplicates financial outcomes across different event deliveries. Store only necessary IDs, amount/currency, timestamps and stateâ€”not raw provider payloads, email or names. Paid invoice records are gross receipts, NOT an acquisition or net-profit report. Zero invoices do not count as a paid customer. Refund ledger, synthetic/staff exclusion and report export remain separate unfinished AD-09 gates.

## Checks before release

- Actual helper + actual SQL tests in isolated PGlite; actual webhook dispatcher and existing agreement-payment regression.
- Final build and TypeScript checks.
- Hosted staging schema/history/access preflight; preserve a private non-empty backup and full profile fingerprints. Apply exact hashed migration once; read back history, permissions and unchanged profiles.
- Hosted transaction fixture verifies replay, invoice dedupe, stale observation and owner/identity rejection; rollback all synthetic fixture mutations. Independent-backend concurrency proof remains required; one in-memory connection does not prove it.
- Exact preview/source and environment check. Keep existing Preview auth-key blocker explicit; do not substitute production credentials.
- Production migration only after staged proof, then exact-commit app deployment. Read-only production state/permissions checks; no synthetic live charges or real-subscription modifications to prove behavior.
- Existing live Stripe endpoint currently subscribes only to checkout.session.completed. New event coverage must be configured through authorized provider controls and read back; code alone does not enable renewal/cancellation delivery. No claim of lifecycle readiness until delivery/replay evidence exists.

Events required by this candidate: checkout.session.completed, checkout.session.async_payment_succeeded, customer.subscription.created, customer.subscription.updated, customer.subscription.deleted, invoice.paid, invoice.payment_failed. No refund claim from this set.

## Rollback / recovery

Preserve ledger rows and migration history on rollback. Do not reset customer profiles from an old snapshot after legitimate billing changes. Application baseline is PR78 dc00a591; it lacks lifecycle reconciliation, so a code rollback restores that known gap, not launch readiness. Prefer a reviewed forward repair. Provider retries should receive a non-2xx response on processing failure; never acknowledge a failed mutation as processed.

Read-only failures must not change access. An observed profile subscription identity changing between provider lookup and commit returns a retryable error. A slower earlier observation cannot overwrite a later applied observation. Historical invoices can be recorded without replacing the current active subscription. A genuinely ambiguous/mismatched identity requires reconciliation rather than guessing ownership.
