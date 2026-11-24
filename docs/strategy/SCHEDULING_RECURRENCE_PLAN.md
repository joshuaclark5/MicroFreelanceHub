# Scheduling recurrence and customer booking follow-up

Status: source-backed implementation plan, not a shipped feature. November 24, 2026.

## Requested outcome

Joshua wants multiple available days selected together, weekly/alternate-week/monthly/yearly recurrence, days off, and an obvious shareable customer booking link. Preserve existing appointments and private records. Searchable timezones are already live in PR30.

## Verified current constraints

- `workspace_scheduling_availability` and `Availability` represent one weekday per rule. The private mutation uses owner-scoped locking, expected versions and operation receipts.
- `workspace_public_booking` points at one `availability_id`, with explicit opt-in, version checks and token rotation. Merely creating several weekday rules will not make all of them available through one link.
- `public_booking_service` generates at most 100 slots in the next seven days and revalidates submissions through the private scheduling mutation. Monthly/yearly rules may have no occurrence in that window.
- Both listing and commit enforce timezone/day boundaries, notice, horizon, duration, buffers, owner-wide overlap/daily cap and connected-calendar freshness/coverage.
- The live deployment's public-booking enablement and Joshua's particular link have NOT been established by this audit. Never present a fixture token as his link or enable one silently.

Sources: app/lib/workspaceScheduling.ts; app/lib/publicBooking.ts; app/api/workspace/public-booking/route.ts; supabase/migrations/20261118020000_workspace_scheduling.sql; supabase/migrations/20261118090000_workspace_calendar.sql; supabase/migrations/20261121000000_public_booking.sql.

## Implementation sequence

1. Verify current deployed migration history and intended staging schema read-only; recover existing staging/backup tooling. Rehearse additive migration and rollback from a verified non-empty backup before production migration. Do not create paid infrastructure or copy customer data for tests.
2. Add a normalized recurrence definition to an availability rule, preserving legacy weekday rules as weekly defaults. A single rule needs multiple weekdays so the existing public link can still target one rule. Use the same recurrence matcher for private validation and public slot listing; do not rely on client-generated matches.
3. Start with weekly/multi-day and alternate-week intervals anchored to a displayed local start date. Follow with monthly day-of-month/ordinal-weekday and yearly date rules. Label absent-date behavior explicitly (e.g. skip a nonexistent monthly day/February29 in a non-leap year), not silent date rolling. Bound dates/intervals and keep an explicit end option.
4. Add explicit local-date closures/days off with clear precedence over recurring availability. Existing bookings remain unchanged and visible; closures prevent new bookings, not cancel appointments.
5. Extend public browsing with bounded date windows and pagination so customers can find occurrences beyond seven days without unbounded enumeration. Keep the existing booking horizon, no busy-event leakage, token/owner isolation and abuse limits. Revalidate the exact offered rule/version and time at commit under existing locks.
6. Add prominent customer-booking navigation, accurate enabled/disabled/deployment-unavailable states, copy and preview controls, and readable weekday/time summaries. Preserve explicit opt-in and preview before sharing; do not send links to customers automatically.
7. Add the multi-day/recurrence form only once its backend semantics are tested. Preview upcoming occurrences in the selected timezone before saving; show how exceptions affect them. Preserve drafts and stable retry operation IDs.

## Acceptance gates

- Legacy rules and existing tokens/bookings retain their behavior after migration and rollback rehearsal.
- Multiple weekdays, alternate-week anchors across year boundaries, monthly31/nth-weekday/last-weekday and leap-year behavior match in listing and commit.
- DST gaps omitted, folds distinguished by UTC instant; fractional-hour zones tested; browser timezone must not change host recurrence.
- Closures, overlaps across rules, buffers, daily cap, notice/horizon and external-calendar stale/coverage guards apply equally to every path.
- Wrong-owner/changed-account/stale-version and changed-body same-operation requests fail safely. Lost replies can be retried without duplicate records.
- Test independent PostgreSQL connections on staging for actual concurrency; embedded PGlite serialization is insufficient evidence.
- Customer flow: owner setup -> preview/copy -> separate anonymous customer sees expected days -> booking -> owner sees exactly one record. No real customer contact/payment/signature in QA.
- Visually review phone/desktop, keyboard and accessible controls; verify exact deployed commit and public behavior before claiming live.

## Baseline run in this batch

`node scripts/test-public-booking.cjs` passed 13 groups against actual disposable scheduling/calendar/public-booking SQL and actual API handlers. Real browser checks at320/1440 covered confirmation and dropped-response retry without duplicates. Data/users were fictional. Embedded database path: C:/Users/joshu/AppData/Local/Temp/mfh-public-booking-l9BtRZ. No live provider, deployed-schema, multi-connection or actual-account capability was proven. No customer mutations or production changes.

## Fresh recovery readiness — November 24

Docker engine responds (29.5.2). Located existing authenticated Supabase CLI3.2.0 without installation. Current project identities and read-only catalogs independently verified: production24 migration records, staging27. Staging-only records are20260929000000,20260929000001,20261021000000; do not infer identical schema merely from shared scheduling column names.

Fresh production schema/data/history exports are nonempty and SHA256-hashed outside Git. Restored into an isolated local Supabase PostgreSQL17.12 container with network=none and no published ports. The two system history tables omitted by normal CLI data dump were exported separately and restored. Final count/content-hash comparison matches all94 tables, including migration histories. No production or staging writes occurred. Storage object bytes are not covered. No recurrence migration or rollback has yet been implemented/rehearsed.

Private receipt: C:/Users/joshu/mfh-private-backups/scheduling-recurrence-20261124/recovery-receipt.json. Preserved stopped container mfh-recurrence-restore-20261124, database recurrence_rehearsal. Resume this known baseline rather than copying it to hosted staging or recreating infrastructure. The previous Docker blocker does not apply to this fresh check. Next implement/test the additive recurrence change against this baseline and synthetic fixtures, verify unchanged legacy fingerprints, and rehearse rollback before hosted work.

## Multi-day / alternate-week database candidate (not deployed)

Added `20261124000000_weekly_recurrence.sql`: nullable recurrence definition leaves legacy single-weekday rules untouched. Closed validation covers unique weekdays, one/two-week cadence, explicit local start/end dates and up to366 unique local-date exclusions. Week intervals are anchored to the Monday of the start-date week; days earlier than the actual start date remain excluded. Shared immutable matcher is called by private booking validation and public slot enumeration. Existing locks, immutable rules, receipt/idempotency, calendar guards, caps and public token/version handling remain in place.

Migration refuses an unexpected source-function baseline rather than overwriting unknown changes. Explicit helper-function ownership matches the existing definer functions. A final exact-source apply was tested on a second fresh restore (`recurrence_final`), not merely repaired in place after development errors. Transactional synthetic SQL proofs cover invalid shapes/dates, cross-year alternate weeks, days off/end dates, legacy behavior, public listing/commit, private rejects, changed-body retry, overlap and immutability. Fixtures roll back. A destructive-schema rollback rehearsal ends in ROLLBACK and refuses nonnull recurrence records. Application rollback should retain additive schema/data.

All94 legacy table fingerprints still match after rehearsal (availability projected to its original columns). Private receipt: scheduling-recurrence-20261124/recurrence-candidate-receipt.json. No hosted migration, API/UI integration, monthly/yearly recurrence, extended public date browsing, or independent-connection concurrency acceptance yet. Do not present this as a working customer feature or production-ready release. Next add API/UI and customer browsing, test actual separate Postgres sessions, verify intended staging function baselines, and pass build/full-browser/release gates.

## API integration candidate

The scheduling API now validates optional recurrence before calling the existing atomic mutation, returns recurrence in its explicit owner-filtered read projection, and preserves legacy requests. Shared typed preview matching operates on explicit local dates, never browser-local Date arithmetic. TypeScript passed. Actual-handler tests cover valid persistence shape, rejected malformed/duplicate/out-of-range/foreign-field requests before RPC and read-back. A read-only parity test compared3200 date matches plus15 validation cases against isolated PostgreSQL and passed (scripts/test-weekly-recurrence-parity.cjs).

This application candidate depends on the new schema. Do not publish before schema rehearsal/staging/production migration and full release checks; the current deployed database lacks the recurrence column. Form integration, customer date-window browsing and separate-connection concurrency tests are still outstanding. No new build or release is claimed in this API-only batch.

## Owner form and independent-connection acceptance candidate

Owner availability now has multi-day checkboxes, weekly/alternate-week cadence, local start/end dates, add/remove days off and a bounded upcoming-date pattern preview. Existing appointments are not canceled by exclusions. Owner booking date checks and saved-rule summaries use the recurrence definition. The form initializes dates after mount using the host timezone; preview is explicitly not a promise of free slots.

Final reviewed production build and TypeScript passed. Four-width built-page tests under UTC and America/New_York passed recurrence save/read-back, empty-day rejection without writes, exclusion/alternate-week rejection, correct UTC booking, retry/account continuity and axe. Phone/desktop screenshots inspected; checkbox spacing corrected and final four-width run passed. All browser API writes were fictional. Evidence: artifacts/recurrence-form-reviewed, recurrence-form-utc and recurrence-form-ny.

Independent PostgreSQL connection gate now passed locally: scripts/test-recurrence-concurrency.cjs clones recurrence_final into a uniquely named isolated database, verifies networknone/no ports, races public/private requests for one slot (one commit, one SQL Slot conflict), then races the identical operation twice (same record). Exactly two synthetic bookings remain in that disposable clone; baseline recurrence_final and hosted projects are untouched. Receipt artifacts/recurrence-concurrency/results.json. This is real separate-session local PostgreSQL proof, not hosted/provider proof.

Remaining before release: extend customer date-window browsing beyond seven days; complete customer-side visual/functional flow; validate current staging function baseline, apply/rehearse reviewed migration with history, run hosted isolation/compatibility checks and exact-commit production acceptance. Monthly/yearly recurrence remains separate unfinished work. Do not deploy this application before its schema dependency.
