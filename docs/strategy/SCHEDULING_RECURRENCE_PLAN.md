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
