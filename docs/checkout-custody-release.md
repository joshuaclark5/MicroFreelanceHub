# Server-owned subscription checkout attempts

AD-06.03 bounded repair; not a whole launch gate. Preserve approved six prices, seasonal offer eligibility, current subscriptions and PR80 privacy gates.

One service-only operation per account serializes checkout creation. The SQL locks the profile before operation rows, freezes customer/session parameters and creation time, and compare-and-swaps replacement only after the trusted handler observes provider expiry. Customer/session writes reject mismatched identities. Browser roles have no table/function access. Stripe customer and session retries use stable operation keys. A different offer cannot open a competing checkout; completed sessions wait for reconciliation. Uncertain operations older than 23 hours stop for reconciliation rather than replaying a potentially evicted provider key. New sessions expire one hour after operation reservation; a changed plan must wait for the existing attempt to expire or finish it. No subscription/charge is created by opening checkout.

## Evidence

- Actual helper + PGlite migration: same-offer concurrency, competing offer, completed session, expired rotation including stale CAS, lost provider response, identity rejection, browser permissions and old ambiguous request guard pass. This is not independent hosted-backend concurrency.
- Existing route regressions retain all six prices, offer rules, existing subscriber guards, attribution and opt-out. Custody helper is mocked in route suite and tested separately against actual SQL.
- Hosted staging rehearsal: verified nonempty 63-profile backup/temporary-table restore, migration and operation assertions, full rollback, original profiles unchanged, custody table absent afterward. Receipt `artifacts/checkout-staging-rehearsal.json`; migration not yet installed.
- Actual Stripe TEST + isolated PGlite: three simultaneous attempts/retry yield one customer/session; competing plan denied; actual provider expiry permits one replacement; lost replacement response recovers same session. `checkout-provider-test.json` preserves initial cleanup failure. `checkout-provider-test-recovery.json` verifies both test sessions expired and zero subscriptions. Stripe's automatically generated test product cannot be archived through its supported API; it and synthetic customer remain for traceability. Do not repeat completed provider checks.

## Remaining release gates

Collect running build41902 and TypeScript55346 results. Install staged migration after current preflight, prove overlapping independent backend operation custody, verify hosted application/controlled fixture behavior, then production backup/migration and exact release/readback under existing authorization. Keep Preview auth-key blocker separate; do not substitute production credentials. No production migration has been applied by this packet.

## Recovery

Keep operation records and provider identities through deployment failure. Do not blindly delete pending operations or recreate customers after uncertain provider responses. For an old uncertain attempt, reconcile the original operation marker/customer/session using read-only provider evidence before any replacement. Never reuse an unrelated customer's identity. Financial records and existing entitlements are unchanged. Returning to PR80 restores the earlier duplicate-checkout gap; prefer a forward repair, preserve custody schema/history, and do not claim launch readiness after a rollback without rechecking the gate.
