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

For the integrated Day-tab candidate, run `python scripts/audit-android-play-bundle.py --require-agenda`. The default audit also supports the archived workspace-only candidate and reports `nativeAgendaPresent: false` for it; passing the default audit alone is not proof of the new Day tab.

## First artifact verification — 2026-11-25 06:32 UTC
- Gradle assemble/bundle passed in 31m17s. Exact 0.1.9/code10 package identity, dedicated-key continuity, APK alignment, AAB signature and matching Play-mode JS passed. Only the production public anon key was found; its project ref matches the configured production origin. No private credential patterns or prohibited website shortcuts were found.
- APK SHA-256: `459c5490d6db938311ea812abef9bdef9824ad3e8256e2d02bb4866b709995b6`.
- AAB SHA-256: `40ea89b62159021105e44dfa2f5bc344f7ebc910ec1faa65d4c3b541ed381159`.
- Upgrade installation succeeded. First UI check encountered an Android System UI ANR overlay; preserved its screenshot/XML, selected Wait. A subsequent package-manager dump timed out under emulator load. After verifying the installed code with the lighter package query, the smoke passed without repeating installation. Final signed-out screenshot was visually inspected and is unobscured; no app fatal exception was found. Authenticated-device workflows are not yet verified.
- Artifacts and evidence preserved locally in `artifacts/android-0.1.9-workspace-only/`, including the explicit `nativeAgendaPresent: false` audit. Nothing uploaded or published. Test AVD stopped after verification to release memory.
- Follow-up Day-tab source passed mobile TypeScript plus Home (Play/direct), account-help, record service/UI, and agenda service/UI regression checks. Hosted staging agenda/task/owner checks passed and synthetic records/accounts were cleaned. A new signed build and actual native Day/Work interaction checks remain.

## Independent QA follow-up â€” 2026-11-25
- Reproduced and corrected two native agenda usability gaps after the first artifact: Day's task shortcut now opens the Tasks section via the same draft/uncertain-operation guard as manual Work navigation; repeated daylight-saving clock times now show zone abbreviations/offsets and elapsed minutes.
- Focused UI checks cover clean navigation, keeping/discarding another section's draft, keeping an uncertain save identity, and preserving an existing task draft. Spring-forward and fall-back duration labels and Day-to-Work integration are covered by fixture regressions.
- These are follow-up source changes only. The archived workspace-only APK/AAB does not contain Day or these fixes; another signed build with `--require-agenda` audit and authenticated device checks remains required.
