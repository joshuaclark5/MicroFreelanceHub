# Transactional email worker operations

## Local implementation; not activated

GET and POST /api/internal/email-worker use the same exact Bearer CRON_SECRET authorization, compared through fixed-length SHA-256 digests with timingSafeEqual. Cookies, request bodies and user IDs never authorize this endpoint. Query parameters are rejected. Responses are private/no-store and return aggregate results only. Neither endpoint logs provider errors, credentials, recipient data or message bodies.

The checked-in vercel.json declares `*/5 * * * *` (every five minutes). The existing Vercel team was verified as Pro; no plan upgrade was made. Function usage counts against the existing allowance. This schedule is not compatible with Hobby. Repository configuration is not proof of a live schedule, available quota or successful invocation:
https://vercel.com/docs/cron-jobs/usage-and-pricing

One invocation selects at most one recorded provider ID for reconciliation and attempts at most one queued dispatch. There is no client-controlled batch size, cursor or provider ID, no loop, and no automatic HTTP retry. Capacity is at most one queued message per five minutes; a growing queue adds delay. Bookings that expire before dispatch are canceled by existing SQL authorization. Do not describe it as immediate email. Check existing Vercel and Resend allowances before increasing capacity; no automatic provider plan upgrade is part of this release.

The function declares maxDuration=60 seconds, a shared 45-second outbound deadline, 3-second database fetch timeouts and existing 15-second provider timeouts. Interrupted or uncertain sends retain the existing unknown/no-resend behavior. These are application/network bounds, not proof of a hard database statement deadline; existing SQL maintenance may scan the pending queue.

## Required database prerequisite

Parent release integration must package and apply **app/lib/server/emailWorker.sql**, after the existing workspace email migration, through the authorized migration workflow. This additive library SQL creates one partial index and one service_role-only SECURITY DEFINER function with pinned search_path:

- workspace_email_evidence_next selects at most one accepted/unknown record with a recorded provider ID, least recently checked first, using row locking and SKIP LOCKED.
- It rotates updated_at and excludes records checked within the last minute. It returns only id, provider_id and recipient to the trusted worker, never ciphertext.
- It does not grant direct table access to service_role, anon or authenticated; no existing closed-table grants or RLS policies are relaxed.
- Missing function/grant errors stop the worker before any dispatch.
- It neither changes delivery state nor binds missing provider IDs. Unknown records without a provider ID remain manual review and are never resent.

Deploy the SQL through the parent release migration, not by copying secrets into scripts or executing it from an HTTP handler. No schema was applied remotely by this implementation.

## Activation checklist for the release operator

1. Keep EMAIL_OUTBOX_WORKER_ENABLED and EMAIL_OUTBOX_SEND_ENABLED unset/false during deployment and migration verification. Enqueue is independently controlled by EMAIL_OUTBOX_ENQUEUE_ENABLED.
2. Verify intended Supabase function ownership/grants and the additive SQL in staging, then use the authorized production migration workflow.
3. Verify existing provider account permission, approved verified bare sender, retrieval permission, existing free quota, authorized test recipient and keyring retention. Provider simulation tests are not this verification.
4. Provision a private CRON_SECRET of 32–256 printable non-space ASCII characters and the existing server-only database, provider and encryption variables described in EMAIL_OUTBOX.md. Never use NEXT_PUBLIC names for secrets.
5. Only when separately authorized, set EMAIL_OUTBOX_WORKER_ENABLED=true and EMAIL_OUTBOX_SEND_ENABLED=true. The worker does not require enqueue enabled, allowing an existing queue to drain after enqueue is stopped.
6. Verify the production deployment actually has the every five minutes schedule; VERCEL_ENV=production and a valid committed schedule plus complete worker configuration produce workerScheduled=true. This field reports configuration only, not runtime health.
7. In authorized staging/provider verification, invoke GET or POST using the private Authorization header through a secret-safe operator tool. Both must reject absent/wrong credentials before DB/provider access; disabled workers return 503. Never put the secret in URLs, browser history, command logs or copied request examples.
8. Verify a consented test outbox row moves through accepted and independently confirmed delivered/bounced states. Review aggregate endpoint results and durable outbox state, not payload-bearing APM/body/SQL logs. Provider retrieval checks exact recorded ID, recipient and sender before changing delivery status.

No environments were activated and no actual provider calls or mail sends were performed here. No deployment, commit or push was performed.

## Failure handling and rollback

401: secret missing, malformed or mismatched. 503: disabled/incomplete config or incomplete work. After a 503 inspect durable state; do not enqueue a replacement or replay a message with unknown outcome. A failed finish may already have sent mail. Existing lease recovery quarantines expired sending as unknown, never automatically resending it. A failed evidence retrieval rotates the record for a later every five minutes check; accepted is not delivery confirmation.

Disable EMAIL_OUTBOX_WORKER_ENABLED first to stop new invocations doing work, then EMAIL_OUTBOX_SEND_ENABLED; stop the schedule and optionally enqueue. Already-started provider requests cannot be recalled. Preserve outbox history and decryption keys. The additive function/index can remain inert; do not delete data or reset attempts to recover.

## Local checks

- node scripts/test-email-worker.cjs: actual compiled endpoint/config/batch/dispatch/provider logic with fictional DB/provider transport. Covers both methods, exact secret gates, disabled configuration, readiness, one-send/one-reconcile bound, missing SQL prerequisite, redaction and lost-finish no-retry.
- node scripts/test-email-outbox-api.cjs: existing route/crypto/provider/worker regressions.
- node scripts/test-email-outbox-db.cjs: real file-backed PGlite migration + worker SQL, closed grants, bounded evidence rotation and existing outbox lifecycle tests. This is not independent-backend PostgreSQL, PostgREST, JWT or provider proof.
- Parent owns final integrated build and live verification. No working-provider claim follows from these local tests.
