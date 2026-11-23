# Client timeline

The Clients screen keeps the existing editable client summary and adds a separate client timeline. Client notes append rather than replace the summary or earlier notes. A unified view includes opportunity activity associated with that client in each original audit snapshot; moving an opportunity never silently moves its historical conversations.

New notes capture the authenticated account ID and profile name (email fallback) inside a database trigger. Callers cannot supply an author. The name is a historical display snapshot, not identity verification or a team-membership claim. Original owner-only opportunity entries are backfilled with their known owner ID; historical names remain null and are labeled as not recorded. The separate CRM screen continues to explicitly describe its current-profile author label.

## Boundaries

- Owner-only, not collaborative team permissions. Composite client/owner FK, forced RLS and explicit actor checks.
- Direct note insert/update/delete denied; the authenticated RPC appends and replays an exact owner-scoped operation ID.
- Identical retry returns the same note, changed payload with the same operation ID conflicts. No email, notification, signature or payment is sent.
- Latest 200 combined entries are shown with an explicit truncation warning. Older records remain stored; this is not a full-history export.
- Draft/uncertain operations are held in component memory only. Keep the tab open for recovery; refresh/navigation does not promise draft recovery.
- Account mismatch hides timeline/draft controls; refreshing rechecks the original account before retry.
- Migration `20261123000000_client_timeline.sql` is additive, but must be backed up, restored and rehearsed before hosted application. New notes also prevent client deletion while dependent history exists.

## Local verification

`node scripts/test-client-timeline-api.cjs`: six actual-handler fixture groups.
`node scripts/test-client-timeline-db.cjs`: ten file-backed PGlite groups, actual migration/RLS, author snapshots, three notes, exact retry, foreign owner, reassignment and 200-entry bound.
`node scripts/test-client-timeline-browser.cjs`: production build at four widths, fixture-only APIs, separate notes, reload, uncertain retry, account switch, truncation and timeline axe checks.
`node scripts/test-connected-handoff-browser.cjs`: recovered handoff prefill, draft save, exact return IDs, explicit link and reload; revoked project fails closed at 390/1440px.

Receipts: C:/Users/joshu/mfh-release-evidence-20261123/client-timeline/.
Local fixtures are not authenticated deployed acceptance. Score remains 28/100 until complete rubric gates pass.
