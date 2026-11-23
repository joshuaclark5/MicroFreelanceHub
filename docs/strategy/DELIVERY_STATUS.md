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

Resume: inspect C:/Users/joshu/mfh-android-tools/native-build.log and a NEW native-build-receipt.json (old successful receipt is 2026-11-23T03:25:49Z). Build runner uses C:/Users/joshu/mfh-native-build/mobile/android; release APK must report preview package version0.1.2/code3 before packaging or installation. Never start a duplicate build. Website build log: home-web-build.log in same tools directory. Check APK source/version/hash, and install with adb install -r only when authorized phone is connected; no data clearing. Then test Home/Time and actual login without handling passwords. Recheck PR8 exact-commit status after rate-limit reset. Remaining 50-point gates above are unchanged; iOS device/Mac access remains an external prerequisite.

Continuation scheduled and accepted: fb1b00fb-2309-44c7-83d1-72c323ab1e84, 2026-11-23T05:33:00Z, same session. Website build generated all150 static pages and final route report/BUILD_ID jQffIwnlGp4oAnHEmhq9p, but PowerShell returned exit1 with a NativeCommandError wrapping Browserslist stderr; no actual compilation error appears in log. Treat exit-status verification as unresolved rather than a clean build receipt. Native Gradle build remains active and has reached cached plugin compilation. Home candidate is not published or installed.
