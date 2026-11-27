# Android 0.1.6 candidate

Version 0.1.6 / Android code 7 prepares the signed-in project/time-entry label correction for a new installable candidate. The prior 0.1.5 artifacts remain preserved and do not contain that correction.

Pre-build source validation: mobile TypeScript, mocked Home/Time label regression, session-startup/action/Google helpers, time-save UI lifecycle and Android JS export passed in preceding work. No change to customer data or save/auth behavior is introduced by this version increment.

Build and release gates remain separate: verify the signed APK/AAB version and unchanged signing identity; scan bundled configuration for public-only credentials; install/inspect on the owned test device before claiming device readiness. Current support-address receiving/fulfillment and Play-policy/track acceptance are unresolved. This document does not assert build success, publication or a new tester download.

Package-audit hardening while native build runs: APK badging must match app.json version/code before any success report is written. Known old garbled labels are checked in both UTF-8 and UTF-16LE; the preserved 0.1.5 Hermes bundle contains the bad labels in UTF-16LE, not UTF-8. The version guard was exercised against the still-old build output and correctly rejected it without producing a 0.1.6 report. These are audit checks, not a successful 0.1.6 package verification.

## Verified package results

Build completed successfully 2026-11-25T02:36:43Z (15m43s). Package verification and bundle audit passed for actual 0.1.6/code7 APK/AAB: dedicated upload signature matches 0.1.4, APK 16KB ZIP alignment and AAB signature valid, prohibited permissions absent, only public anon backend configuration detected, old garbled labels absent in UTF-8/UTF-16LE.

- APK SHA256: cb924c3234532a0f39e542efc1d4d2e2d1c4646d704c2e878aaaa9ce90b2da6b
- AAB SHA256: d5ea77640a5be3af28784844d03ec8e732b6c93e63a181c8b193f80ffa6e0626

Preserved separately under local artifacts/android-0.1.6-candidate. Device acceptance and publication are not established by these package checks.

Device smoke: upgrade install on owned Android15 emulator5560 passed; installed version0.1.6/code7 confirmed, process launched without observed fatal exception and signed-out controls passed. Screenshot reviewed: current logo, readable status bar and sign-in fields. Evidence artifacts/android-0.1.6-device/result.json and launch.png. Authenticated sessions, physical devices, support delivery and Play publication remain unverified.
