# Delivery evidence - 2026-11-23

## User objective
Continue to at least 50/100 verified readiness. Joshua also wants account histories with separate second/third notes, timestamps and author names.

## Shipped and observed
PR7 merged at f4ed5f85238fdcc7d0bd45954c0ad6b1dee108b7. Vercel commit status successful. Public www.microfreelancehub.com/dashboard returns HTTP200 and its referenced client chunk contains the action queue. Local evidence: C:/Users/joshu/mfh-release-evidence-20261123/pr7-production.json. Reply-To code is in this release; actual receiving/reply verification is NOT completed. No extra email sent.

## CRM increment
Existing CRM stores an append-only opportunity history linked to a saved client. New UI labels notes with the authenticated owner's current profile name (fallback Account owner), client name and timestamps. This is not an immutable historical name snapshot or multi-user collaboration. The Clients screen still has a single editable notes field: do NOT call that an append-only account-wide timeline. A unified account-level history is still pending.
Tests: 12 API groups, 19 database groups, four browser widths with three separately saved notes, persistence after database reopen, exact retry deduplication, owner isolation. Browser uses fictional intercepted API; database is local PGlite, not live Supabase proof. No database migration in this increment.

## Remaining goal gates
Score remains 28/100 until complete dimension acceptance gates are verified; do not replace the rubric to claim 50.
- Complete client/project/agreement/signature/invoice workflow; handoff fix saved separately on fix/project-agreement-handoff-20261123, ed6ed31, browser acceptance pending.
- Application-level Stripe trial checkout/webhook mapping/renewal/cancellation test-mode proof; seven-day trial stays off. Provider no-card expiry alone is insufficient.
- Reply handling receipt and remaining onboarding/accessibility checks.
- Android signed-in workspace observed previously, retry/session-switch checks still pending. iOS controlled Mac/device and developer review remain external dependencies.
- Account-wide append-only notes with stable author attribution still required for Joshua's full requested CRM experience.

No new purchase, payment, subscription, or email authorized by these tests. Existing customer billing unchanged.

## Home navigation increment, November 23

Joshua requested an intuitive mobile Home button and bird's-eye view while continuing toward 50. The 0.1.2 candidate adds fixed Home/Time tabs, a default Home overview of loaded active projects and latest 20 completed entries, first-five project list, and explicit website shortcuts to Clients/CRM/Agreements/Invoices. Tab changes preserve time drafts/reviews/retry state; account changes reset Home and clear private state. Google PKCE sign-in from fbf6f30 restored into the release branch (the release-only rollback had excluded mobile work). No billing or schema changes.

Passed this turn: mobile TypeScript, Google callback/PKCE helper, native crypto test vector, session feedback tests, mocked React Native Home navigation/draft preservation/account reset. Risky-copy scan: no prohibited phrases in changed App surface. Source matches the native build App.tsx by SHA256 A1969BA4873327D285BFBC7C6F2B7B394F6017B375B93AEEC801787A3749F928. Native build is running, not yet verified. ADB returned no connected device, so no install, restart or on-device acceptance was performed.

CRM PR8 merged at 3e03adf85d1c3288136137eceb139421b4baa515. Public /workspace/crm HTTP200 and referenced chunk contain the new note labels. Exact-commit provider status is blocked by GitHub HTTP403 rate limit (~37 minutes at check), not a failed deployment. Receipt: C:/Users/joshu/mfh-release-evidence-20261123/pr8-production.json. This still does not implement account-wide notes.

Historical resume instruction (build now recovered below): inspect C:/Users/joshu/mfh-android-tools/native-build.log and a NEW native-build-receipt.json (old successful receipt is 2026-11-23T03:25:49Z). Build runner uses C:/Users/joshu/mfh-native-build/mobile/android; release APK must report preview package version0.1.2/code3 before packaging or installation. Never start a duplicate build. Website build log: home-web-build.log in same tools directory. Check APK source/version/hash, and install with adb install -r only when authorized phone is connected; no data clearing. Then test Home/Time and actual login without handling passwords. Recheck PR8 exact-commit status after rate-limit reset. Remaining 50-point gates above are unchanged; iOS device/Mac access remains an external prerequisite.

Continuation scheduled and accepted: fb1b00fb-2309-44c7-83d1-72c323ab1e84, 2026-11-23T05:33:00Z, same session. Website build generated all150 static pages and final route report/BUILD_ID jQffIwnlGp4oAnHEmhq9p, but PowerShell returned exit1 with a NativeCommandError wrapping Browserslist stderr; no actual compilation error appears in log. Treat exit-status verification as unresolved rather than a clean build receipt. Native Gradle build remains active and has reached cached plugin compilation. Home candidate is not published or installed.

## Recovered Android Home build and packaged artifact

Existing build completed successfully at 2026-11-23T05:30:26Z, exit 0, Gradle BUILD SUCCESSFUL in 11m35s (253 tasks). No duplicate build started. APK inspected with aapt2: com.microfreelancehub.mobile.preview, 0.1.2/code3, arm64-v8a, minSDK24/targetSDK36. apksigner verifies APK v2 signature with the internal Android debug certificate; not a store release.

Packaged existing binary: C:/Users/joshu/mfh-android-tools/releases/MicroFreelanceHub-preview-0.1.2-code3-arm64.apk (21,052,769 bytes).
SHA256: 70f0746d85edce49dd86ccd96953775689775d8bb0a7c1ecae200ce1cba00b04.
Evidence: same releases directory, home-0.1.2-verification.json, home-0.1.2-build-receipt.json and home-0.1.2-build.log.
App.tsx and every mobile/src TypeScript file plus shared workspaceTime.ts match source commit 221601ba2b0ef4b56c8166362f68f1337a4e558a after CRLF normalization; only Google sign-in/crypto files differ in raw line endings. Original build and source preserved.

ADB again reports no attached devices. No install, restart, data clear or runtime acceptance performed. Once the authorized Samsung reconnects, install this exact APK with adb install -r (never uninstall/clear data) and verify Home/Time, Google sign-in, draft/review preservation, save/retry and account-switch isolation. iOS remains unverified.

PR8 exact-commit GitHub status recheck still returns HTTP403 rate limit. No publication repeated. Existing public-code proof remains distinct from exact-commit provider confirmation.
Recovered original scorecard at C:/Users/joshu/mfh-private-backups/neat-prawn-reviewed-20261123/removed-working-files/docs/strategy/COMPETITIVE_SCORECARD.md; its six complete acceptance gates remain authoritative. Score stays 28/100; APK packaging alone awards no points.
Memory search was unavailable (timeout; automatic index repair requested); state recovered from bounded session history and saved project evidence instead. No other active mutation worker found in session inventory.

## Website timeline and handoff continuation

Recovered and saved the existing ed6ed31 project/client handoff without duplicating its implementation. Local commit af29f5d includes fresh fictional-browser acceptance at 390/1440px: project/client prefill, agreement save, exact return IDs, explicit link save/read-back, and revoked-project rejection. Schema-free release is isolated in a managed child checkout; publication outcome is recorded separately below.

Client timeline candidate commit 76f0855 adds separate append-only client notes and a unified chronological view of opportunity audit entries, preserving the original client association from each historical snapshot. Author account ID and display name are captured server-side; historical names that were never recorded remain explicitly unknown. Existing editable summaries and opportunity audit rows remain intact. Latest 200 entries are shown with an explicit bound. Exact operation retries dedupe; direct writes and cross-owner access are denied.

Fresh local evidence: C:/Users/joshu/mfh-release-evidence-20261123/client-timeline/ (api-results.json, db-results.json, browser-results.json, handoff-browser.json, final-build.log, continuation-receipt.json). Six actual-handler fixture groups, ten initial PGlite groups, four responsive browser widths with axe and account/retry checks, connected workspace API863/863 cases, TypeScript and production build exit0. Browser mutations are intercepted fictional records; PGlite auth is synthetic. These are not live Supabase or complete approval/signature/invoice evidence.

Hosted timeline migration was NOT applied. Current production and intended staging migration histories and absent timeline schema were inspected independently. Fresh backup/restore/rehearsal remains blocked: docker desktop start returned0 but Docker engine pipe remained unavailable and later status failed. Historical verified nonempty backups are not a fresh baseline. Receipt: C:/Users/joshu/mfh-private-backups/client-timeline-20261123/recovery-blocker.json. The release skill requires restore/rollback proof before production schema changes.

Existing managed browser tabs were discovered, but snapshot/open failed with Playwright target initialization timeouts; doctor confirms CDP transport only, and one snapshot retry also timed out. No authenticated deployed workflow mutation was attempted. No browser restart/closing unrelated user tabs, mobile rebuild, phone wait, payment, customer send or spend. Memory recall timed out with automatic index repair requested; recovery used saved project evidence and bounded session history. Score remains28/100 against the original six complete acceptance gates.

Release-only handoff checkout completed at C:/Users/joshu/.openclaw/worktrees/d2d857b0f46402ce/release-recovered-project-agreement-handoff, commit13a8e87dddc246cb10c0f0f51b8b61b27594c849. Its eight restored files match ed6ed31 exactly, on main3e03adf. Handoff/context/draft tests, production build150 pages and TypeScript passed independently. Managed publication readiness repeatedly timed out after5seconds; binding remains unverified, not proven unbound. No publication submitted, no PR/requestId, no deploy or merge.

Timeline review identified pending-operation loss when filtering removed a client card. Fixed by retaining draft/pending identities in an owner/client-keyed workspace map; browser regression now requires filter out/in then identical retry. Fresh explicit local rollback rehearsal passed (11 DB groups) and preserved populated notes/audits. This remains synthetic local evidence, not a restored-production-baseline rehearsal.

Final reviewed-candidate verification: review-fix-build.log exit0; TypeScript exit0; four-width browser rerun passed including unconfirmed save -> filter client out/in -> exact original retry with one stored note. Test synchronization now waits for POST response and saved timeline row rather than matching draft text. Database suite passes11 groups including rollback rehearsal. Publisher readiness retried once after build completion and still timed out; no publication or requestId.
