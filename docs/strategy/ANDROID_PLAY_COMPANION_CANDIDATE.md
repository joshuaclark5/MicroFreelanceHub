# Play companion candidate — local only

Date: 2026-11-24 America/New_York

`EXPO_PUBLIC_DISTRIBUTION=play` selects a compile-time companion UI. Default/direct builds retain website navigation. This change does not modify the already published 0.1.6 APK, website billing, or customer invoices.

Play mode omits external website signup/recovery, project links, the workspace shortcut grid, and the general website/support navigation card. It retains Google account creation/sign-in, email/password sign-in, project overview, nonbillable time review/save/retry, sign-out, and privacy/deletion-request controls. Empty-state text does not direct users into web setup. Password recovery currently requires support; the mailbox is not yet operationally verified. This is not a claim of policy compliance.

## Verification

- Mobile TypeScript passed.
- Mocked Home/Time/account-switch tests passed in both default/direct and Play modes; Play assertions cover absent external navigation on signed-in Home and signed-out screens, retained Google/privacy/deletion controls, and no external URL calls during those flows.
- Google OAuth, session startup/action, secure storage (including 48 restart boundaries), save UI, startup UI and account-help regression suites passed. No customer writes or emails.
- Changed native copy risky-language scan and git whitespace check passed.
- Android Hermes export passed with `EXPO_PUBLIC_DISTRIBUTION=play`. Six checked web-navigation labels are absent from the compiled bytecode. Receipt: `artifacts/android-play-companion-export/verification.json`; bundle SHA-256 `eeb60e6cb6174e02be788d1014846b603b7dd8df874a1f997ec8abf8f0b07e4a`. This byte-string check supplements UI tests; it is not proof of every possible navigation path. Export is not a signed AAB, device acceptance or store publication.

## Required before submission

1. Confirm monitored account-request mailbox, align disclosures, and verify fulfillment and email-password recovery. Existing support address is not yet verified.
2. Audit privacy-page downstream navigation and Google signup/entitlement paths. Removing purchase shortcuts alone does not prove all policy conditions are met.
3. Add a dedicated Play build recipe enforcing the mode; increment version/code and preserve existing tester artifacts. Existing tester build script still creates direct-release artifacts and must not be used as proof of Play mode.
4. Build and inspect the exact signed package, test both new and existing accounts on device, including empty-project usefulness, session restart/sign-out and uncertain-save recovery.
5. Finish store listing/data safety/reviewer access, testing-track requirements and review.

No new binary has been published. The broader overnight goal remains active, including authenticated competitor auditing and payment/signature acceptance.

## Signed build continuation — 0.1.7/code 8

Version configuration advanced to 0.1.7/code 8. Dedicated build script `scripts/build-android-play-candidate.cjs` forces Play mode and requires existing signing custody (no new key generation). `scripts/verify-android-play-package.cjs` checks package/version, non-debug signing and certificate continuity, restricted permissions, zip alignment and AAB signature. `scripts/audit-android-play-bundle.py` checks public-only backend configuration, absence of direct-navigation labels, and identical APK/AAB JavaScript. `scripts/smoke-android-play-device.cjs` targets only the existing test AVD and validates installation, version and signed-out launch; it does not claim authenticated acceptance.

Build launched with output in `artifacts/android-0.1.7-release-build.log`; completion receipt is `artifacts/android-0.1.7-build-receipt.json`. Native build initially slowed under low available RAM. The task-owned emulator was stopped to free memory; unrelated processes were not stopped. Restart the mfh-tester-20261124 AVD after package verification. Do not run verification against stale 0.1.6 build outputs or claim success before the matching receipt and exact-version checks pass. Existing published artifacts remain preserved under `artifacts/android-0.1.6-candidate`.

Follow-up: build advanced through Kotlin plugin compilation and Expo configuration, with no final receipt yet. Exercised the bundle audit against old output: exact-version guard correctly rejected it. Direct-navigation label checks now cover both UTF-8 and UTF-16LE Hermes strings. Store listing draft in `ANDROID_PLAY_LISTING_DRAFT.md` is source-scoped (17/30 name, 72/80 short description, 1170/4000 full description characters); risky-copy scan passed. This draft is not uploaded and does not close authenticated-device, support or policy gates.
