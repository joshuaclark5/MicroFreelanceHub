# Android Play release - verified readiness

## Scope and authority
Joshua requested an Android app and Play publication while web/calendar work continues. Use local tooling; no new paid build service. A five-star rating is an aspiration, not a verified rating or promise.

## Observed 2026-11-24
- Play Console personal developer account is accessible and shows Create your first app. No app record, app approval, production access, or store publication was observed. Create-app declarations have not been accepted.
- Existing Expo 54 native preview has Home, project browsing and time capture, not website feature parity. Preview APKs use a debug certificate and preview application ID; never upload those as production releases.
- Intended package: com.microfreelancehub.mobile. Availability not yet checked/reserved.
- Local Android SDK 36 and Java 17 are available. No Android device is currently attached; no emulator is installed.
- Native login currently lasts only in memory. Encrypted session storage is under development, not yet enabled.
- Calendar work is isolated in openclaw/global-time-off-proof. Its migration is applied to staging only; production and feature gate remain unchanged.

## Release gates
1. Native session restore, account isolation, logout and recoverable pending-write handling; device restart/lock/offline/upgrade tests.
2. Native calendar/services/client workflows and accessible small-screen/large-text design. Review actual device screenshots, not just bundles.
3. Review external links and digital SaaS subscription flows against Play Payments policy. Do not assume existing Stripe web links are acceptable in the Android app. No new paid purchase flows yet.
4. Functional account-deletion request and external deletion-request URL with accurate retention policy. The current website deletion hold is not a finished deletion lifecycle.
5. Production signing key custody, signed AAB with production application ID, dependency/permission review and actual device testing. Never expose keys or publish debug-signed preview builds.
6. Truthful listing/screenshots, privacy and Data Safety declarations based on actual SDK/network behavior, content rating and reviewer access.
7. Internal test upload, account-specific closed-test/production-access requirements, then Google review and exact-version store verification.

For new personal accounts created after 2023-11-13, Google's current policy requires at least 12 testers continuously opted in for 14 days before applying for production access. Account creation date and this account's specific requirement are not yet verified. Real testers must participate; credits cannot bypass this condition. Do not recruit/message testers without authorization.

## References
- https://support.google.com/googleplay/android-developer/answer/14151465?hl=en
- https://support.google.com/googleplay/android-developer/answer/9858738?hl=en

## Session storage candidate
`mobile/src/encryptedSessionStorage.ts` is a dependency-injected adapter for an encrypted native store. It serializes reads/writes/removals, uses bounded Unicode-safe parts, and publishes the new manifest last. Failed part writes preserve the old session; missing parts fail visibly. Old committed generations are removed after replacement. An encrypted recovery journal removes interrupted-write orphan parts on the next access while preserving the committed generation. All 48 before/after write/delete restart cases passed. The native SecureStore bridge and Android backup exclusion plugin are added; device-level validation and startup/error UX remain required before enabling persistence. No plaintext token store is introduced. The current App still uses memory-only sessions.

Focused test: `node scripts/test-mobile-secure-storage.cjs`.

Dependency install completed successfully; mobile TypeScript passed. Native storage is still not wired into App. No device/build/store-release claim.

## Secure-session integration follow-up
The local App now uses the SecureStore adapter, a session preflight/restore gate, process-wide auth lock and safe retry UI. Workspace waits for its auth callback before showing sign-in, avoiding a returning-account flash of signup. Startup tests cover new/returning sessions, locked storage, auth failure and a pending restore. OAuth, session-scoped feedback and Home navigation regressions pass. Mobile TypeScript passes. Actual native storage/restart/offline/sign-out and visual device testing remain unverified; time drafts and pending operations remain memory-only. Earlier statements that App was memory-only describe the earlier candidate only.
