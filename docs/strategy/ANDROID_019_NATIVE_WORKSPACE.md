# Android 0.1.9 / version code 10 candidate

This is a candidate, not a publication receipt. The previously verified 0.1.8 internal Play release remains the released version until a separate upload/rollout is confirmed.

## Candidate scope
- Native Work tab: clients, pipeline stages, projects and tasks.
- Search and bounded pagination with explicit incomplete-list guidance.
- Review before saving; owner-scoped writes and original-version checks.
- Lost-response recovery keeps the same operation/record identity; uncertain payloads are locked until retry or explicit discard.
- Existing project overview, nonbillable completed-time capture and account controls are retained.

The first 0.1.9 build was launched from workspace checkpoint `5228fa3`. Follow-up agenda source is not imported by that checkpoint. Do not advertise native calendar functionality for that artifact.

Drafts and pending retries remain in memory. Finish or reconcile a save before closing the app. No offline persistence, native invoice/payment flow, subscription purchase, signature flow, or full website parity is claimed.

## Suggested internal tester release notes
New Work tab: manage clients, pipeline stages, projects and tasks without opening the website. Review changes before saving, and recover an uncertain save using the same operation. Keep the app open while resolving an unconfirmed save. This remains an early internal test; many website workflows are not yet native.

## Evidence required before delivery
- Production public-anon backend only; no private credential patterns in APK/AAB.
- 0.1.9/code10 package identity, dedicated upload certificate continuity, APK alignment and AAB signature.
- APK and AAB contain the same Play-mode JS, with website purchase shortcuts absent.
- Emulator upgrade installation and signed-out launch.
- Clearly distinguish fixture/hosted authenticated coverage from actual authenticated-device coverage.
- Review privacy wording/store declarations for client contact fields and task notes newly displayed in the native app.
- Preserve old artifacts and record exact SHA-256 hashes, evidence paths, source checkpoint and any unfinished checks before upload.

The subsequent build script adds a tracked-source hash and refuses a successful exit when sources change during the build. Metro workers are capped separately from Gradle workers to avoid memory pressure on the shared host.

## Follow-up source (after first bundle generation)
The Day tab now imports the native read-only month/day agenda and due-next tasks. Home/Time-only project statistics, refresh controls and time history no longer clutter Work/Day. Native tabs use compact spacing. Navigation regression tests verify that visiting Day preserves an unfinished time draft and does not expose website purchase shortcuts. This source requires another build; do not confuse it with the first workspace-only 0.1.9 artifact.
