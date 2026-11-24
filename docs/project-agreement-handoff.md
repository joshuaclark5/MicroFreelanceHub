# Project to agreement handoff

Project cards retain the project ID when opening agreement links. The link form preselects only IDs present in the authenticated workspace load. Its New agreement action opens the guided draft with the owned project name and the client's name/email.

The editor resolves both records with the current authenticated user's owner_id, with no user ID accepted from the URL. Invalid, unavailable, foreign-owner, and mismatched-client records fail closed. Before saving, it rechecks session ownership and the project's client association. Project drafts use a separate owner/project/client-specific brief cache and never restore/write the generic editor cache.

Successful saves and New draft clear only the current context's brief cache; generic drafts and other owners/projects/clients remain untouched. Query changes remount the whole editor, and brief-cache identity changes remount the guided form, preventing old in-memory values and error state from carrying into another context. Cancelled initialization cannot restore an old draft or redirect a newly navigated editor. Save validation reads the live authenticated user both before and after the owner-scoped project/client queries; an unmounted editor cannot begin an insert or redirect after a completed insert.

Local regression command: `node scripts/test-agreement-handoff.cjs`. Uses in-memory storage and database/auth fixtures; exercises cache deletion/isolation, session changes and logout during ownership lookups, client reassignment, revoked access, query-key remounts, and brief-cache remounts. No customer records are created or modified. This is not a browser/RLS integration test.

After saving the unsent draft, the editor returns with the exact project and generated agreement ID. The user reviews the preselected existing link form and saves the link through the existing authenticated workspace API and ownership constraints. Linking is deliberately separate and explicit: no schema migration, automatic cross-table write, sends, signatures, or payment operations.

Local check receipts (2026-11-23):
- `node scripts/run-configured.cjs build`: exit 0, process `sharp-gulf:6792badcdbce`; all 150 static pages completed. Configured private environment loaded without copying or printing credential values. Existing configuration skips build-time type/lint checks; Browserslist freshness and edge-runtime notices remain.
- `node node_modules/typescript/bin/tsc --noEmit --incremental false`: exit 0, process `kind-nexus:6792badcdbce`.
- `node scripts/test-agreement-handoff.cjs`, `node scripts/test-agreement-context.cjs`, and `node scripts/test-agreement-draft.cjs`: each exit 0.
- Prior build handle `mild-reef:6792badcdbce` was absent from the process registry; no recoverable exit receipt was available. Its `.next` artifacts were incomplete, so it is not counted as a successful build. One replacement configured build was run and collected to completion.

Verification still required before any score change:
- Authenticated deployed end-to-end draft save, return, explicit link save/read-back.
- Separate-account, revoked project/client access and account-switch tests against real RLS.
- Cross-device recovery and partial/uncertain write behavior.
- Existing agreement-save uncertainty is not solved by this handoff; do not retry an unconfirmed save without inspecting records.
- No verified-score increase is claimed by local implementation/tests.

Fresh continuation check: restored exact ed6ed31 implementation; context/handoff regressions and TypeScript passed. Local production-build browser fixture now passes project/client prefill, draft save, exact return IDs, explicit link, reload read-back and revoked project rejection at 390/1440px. Receipt: C:/Users/joshu/mfh-release-evidence-20261123/client-timeline/handoff-browser.json. This is fictional intercepted API evidence, not deployed authorization or complete signature/invoice acceptance.
