# Opt-in public booking rollout

## Scope and prerequisites

Apply reviewed migrations in order through `20261121000000_public_booking.sql` (requires existing scheduling and calendar migrations). This is additive: no existing accounts are enabled and existing billing, SEO, customer records, and payment flows are unchanged. No new paid service is required. This change does not send email, create invitations, charge payments, or trigger provider refresh calls.

The server needs its existing Supabase URL/service-role configuration. Keep `PUBLIC_BOOKING_ENABLED` absent/false until migration verification and staging checks pass. Set it to `true` only on an approved deployment. This server-only switch gates public requests and new enable actions; owners can still disable configurations when the switch is off. Credentials are never delivered to browsers.

Owner setup: Scheduling → Configure an opt-in public booking link → choose one existing availability rule and published intake → explicitly enable and save. Review questions/privacy text before sharing. Each owner gets an unguessable 244-bit handle, generated from two random UUIDs. Enable/disable/replace use owner identity and optimistic version checks. Replacing or disabling a link invalidates prior public access; existing bookings and private intake answers remain unchanged.

## Privacy and availability

`/book/[token]` is a standalone HTML route, deliberately outside the shared root analytics and feedback layout. It loads no third-party scripts, images, fonts, or analytics. CSP prohibits framing and restricts connections to the same origin. Page and API responses use no-store, noindex/nofollow/noarchive and no-referrer. No sitemap changes or public index links are added. The handle is a bearer capability: avoid analytics/logging full booking URLs and share only with intended visitors.

The API reveals only the selected title, timezone, duration, questions, consent, configuration version and up to 100 available starts over the next seven days. It never returns owner/rule/intake/booking IDs, attendee data, busy intervals, calendar credentials or calendar metadata. Answers use the existing owner-only scheduling storage and immutable intake versions. Visitors receive a minimal confirmation, not a private booking object.

Existing scheduling rules are enforced by the existing mutation: weekday/grid, notice/horizon, duration, buffer, daily cap, DST-transition restrictions and all-rule overlap. The public RPC uses the identical owner advisory transaction lock as private bookings and configuration, then re-reads the handle. The existing calendar trigger enforces freshness and coverage at insertion. Availability listing also fails closed for stale, connecting, reconnect-required or uncovered mirrors. No connection/disconnected means local-only scheduling. Calendar snapshots currently expire after five minutes; owners must refresh their existing connector before accepting bookings. No automatic refresh or provider availability claim is implied.

## Abuse and retries

Closed schemas, bounded streaming JSON (22 KB public / 2 KB owner), canonical UTC dates, bounded questions/answers, consent, exact same-origin JSON POST, honeypot, and token-bound HMAC challenge (2 seconds–15 minutes) protect submission paths. These controls reduce abuse; they do not identify a human.

A separately committed SQL throttle survives booking rollback: per link 120 reads/minute and 30 writes/hour; per identity 30 reads/minute and 5 writes/hour. Token-wide limits cannot be bypassed by rotating IPs. The application trusts only Vercel's platform-overwritten `x-vercel-forwarded-for` when `VERCEL=1`; other deployments deliberately share a conservative identity bucket. Do not enable arbitrary proxy-header trust. Limits use keyed IP hashes, not raw IPs; expired counters are removed on subsequent throttle calls. Rate limits also count failed booking attempts. No paid CAPTCHA is used; sustained targeted abuse can temporarily exhaust a link's quota. Disable/replace a leaked link as needed.

Service-only SQL access is mandatory: never grant the public service/throttle functions to anon or authenticated. The façade temporarily binds the selected owner only within the privileged transaction to reuse existing scheduling logic, restores the original identity, and grants no generic owner mutation capability. Public operation UUIDs plus a hash of the exact request provide durable idempotent confirmation; changed requests cannot reuse an operation. Disable/rotation deliberately denies even old receipts.

## Local verification

- `node scripts/test-public-booking.cjs`: 13 check groups passed, including actual SQL, real route validation, and desktop/mobile browser confirmations with a deliberately truncated post-commit response and idempotent retry.
- `npx tsc --noEmit --incremental false`: passed.
- `npm run build`: application compilation succeeded; page-data collection was blocked by missing Supabase URL configuration in the existing `/api/sow/mark-paid` route. This is not a production build/deployment pass. The pre-existing TypeScript build-cache bytes were preserved.
- `git diff --check`: passed (a line-ending warning in an unrelated shared file is not a whitespace error).

## Verification and release checklist

Run `node scripts/test-public-booking.cjs`. It applies the actual scheduling, calendar and public-booking migrations to a disposable file-backed PGlite database, exercises non-bypass browser roles and service RPCs, tests SQL invariants and throttling, and routes real API validation into actual SQL. The same suite opens the actual standalone document in headless Edge at mobile/desktop widths against those handlers and the disposable database, including a deliberately lost post-commit response and same-operation retry. Auth/provider adapters are fictional; no live Supabase/provider result is claimed. Embedded concurrent requests serialize on one backend, so they do not prove independent PostgreSQL backend contention.

Before production rollout, apply migrations to an authorized staging database, verify role grants, and exercise simultaneous public/public and public/private requests over independent database connections. Exactly one overlapping booking should commit. Check enable/disable/rotate, stale configuration rejection, canceled-slot reuse, current intake requirements, fresh/busy/stale calendar states, and anonymous denial of tables/service RPCs. Run the integrated `npm run build` and browser-check desktop/mobile forms, retry behavior, copy link, keyboard labels, noindex headers and absence of analytics requests. Check actual deployment environment gating before enabling any owner.

Rollback: set `PUBLIC_BOOKING_ENABLED=false` and/or disable the affected owner link. Keep the additive tables/migration and all existing bookings for history. Do not drop tables or delete bookings as an operational rollback.
