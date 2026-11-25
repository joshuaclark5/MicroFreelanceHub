# 0.1.5 / code 6 candidate ? account help

Local follow-up to the published 0.1.4 early APK: visible privacy/deletion-request controls with adjacent missing-handler errors, and dark status-bar icons. The request action opens an email draft only, not a completed deletion or subscription cancellation. TypeScript and focused account-help/startup/Home tests pass. Signed APK/AAB build, package checks, same-certificate upgrade install and signed-out device checks passed. Privacy controls and the missing-email-handler fallback were visually inspected. The candidate is not published: receiving-route verification remains incomplete. Full authenticated-device and Play-policy acceptance remain unfinished. See docs/strategy/ANDROID_PLAY_POLICY_REVIEW.md.

Historical 0.1.4 preparation follows; its public APK remains unchanged.

# 0.1.4 / code 5 expedited tester candidate

This early Android build covers encrypted sign-in, active-project overview and nonbillable time capture. Calendar and customer booking setup open the existing website, with separate browser sign-in. Those are not native calendar screens. Unsaved drafts and uncertain time-save retries remain in memory: finish/retry before closing the app.

Joshua authorized prioritizing a usable tester artifact within one hour, accepting minor bugs. This does not waive signing, data-isolation or basic runtime checks, and does not guarantee Play approval. APK sideloads do not count toward a Google Play closed-testing requirement. Public-store readiness and closed-test delivery are separate milestones.

Production package com.microfreelancehub.mobile; version0.1.4/code5. Dedicated upload signing material remains in a private backup directory, not this repository. Generated native directories and output binaries are ignored. APK/AAB verification and emulator results must be recorded before calling this artifact tested or delivered.

## Android Play candidate - secure-session integration (2026-11-24)

Source now restores encrypted device sessions before showing sign-in or workspace. Failed restore shows a retry screen, not a new-account prompt. Native SecureStore stores chunked tokens with recovery journaling; Android backups exclude SecureStore data. Supabase processLock serializes authentication refreshes within the app process. This is local implementation, not device acceptance or a published release.

Time-entry drafts and uncertain save operations are still memory-only: finish/retry them before closing the app. Restoring a login does not recover those drafts. Corrupted-storage reset UX, full native restart/lock/offline/sign-out tests, and production signing remain unfinished. Existing website links still need Play Payments policy review.

Checks: `node scripts/test-mobile-session-startup.cjs`, `node scripts/test-mobile-secure-storage.cjs`, mobile TypeScript, OAuth/session/navigation regressions, and Android JS export. None substitutes for a signed AAB or device test.

Historical preview details below describe older builds, not the new session behavior.

# Current release readiness: 0.1.3 candidate

The shared logo, Home links and project-specific website navigation are updated in source. These links open the website and may require a separate web sign-in; customer notes are not yet native screens.

Android native builds remain internal previews using `com.microfreelancehub.mobile.preview` and a debug certificate. Do not submit these APKs to Google Play. A production-signed AAB, store listing/data-safety declarations and store review are still required. iOS needs a controlled Mac/Xcode build, distribution signing, device acceptance and App Store submission/review. Neither platform has a guaranteed approval-day publication date. Do not purchase cloud builds or enrollment without separate spending authorization.

App icon source is `public/brand/mark.svg`; `scripts/render-brand-assets.cjs` generates native bitmap assets. Version0.1.3/code4 must be verified from the built binary before installation or packaging. Existing0.1.2 artifact remains preserved.

---

# MicroFreelanceHub native core prototype

## Google sign-in candidate (0.1.1)

Adds Continue with Google using the system browser and Supabase PKCE. The same Google identity accesses the existing backend account; users do not need an email password or a duplicate account. Website signup/recovery links are explicit secondary paths. This implementation is not yet end-to-end verified on a phone.

The exact callback `microfreelancehub://auth/callback` was added and verified in Production Supabase's redirect allowlist, preserving the three existing web/local entries and Site URL. Expo declares the scheme. Callback parsing rejects other addresses, fragment tokens, missing/duplicate codes and provider errors. The SDK exchanges the single-use code against its in-memory verifier. Native Expo Crypto supplies secure randomness and SHA-256 with a TextEncoder polyfill; authorization fails closed unless the SDK emits S256. No Google client secret or backend service-role key is embedded.

Sessions and PKCE state remain memory-only. OS termination during sign-in requires a new attempt. Secure persistent sessions, iOS native testing, store signing and full provider/device verification remain pending. Internal Android build uses separate preview ID and debug signing; do not upload it as a production store artifact. Avoid installing both preview and production apps with the same custom scheme during testing.

Focused checks: `node scripts/test-mobile-google.cjs`, `node scripts/test-mobile-native-crypto.cjs`, and `npm run typecheck --prefix mobile`. These validate parsing/control flow/crypto adapter behavior, not Google consent or native return-to-app behavior.

Historical prototype notes below predate this candidate; Google OAuth is now implemented locally but not verified end-to-end.

Expo SDK 54 / React Native for iOS and Android; not a WebView, PWA, signed binary, device-tested app or store release. Shares the existing secure Supabase accounts, RLS and `workspace_time_mutate` operation. No new database or alternate billing system.

## Core flow

Existing email/password account Ã¢â€ â€™ active projects Ã¢â€ â€™ log completed nonbillable time Ã¢â€ â€™ refresh latest 20 entries. Reuses `app/lib/workspaceTime.ts`. Revalidates account identity before mutation; retries preserve the same operation ID. Existing database constraints/RLS remain the authorization boundary. No service-role key belongs in the app.

Sessions are **memory-only** in this prototype. They are cleared on process exit; the app suspends token refresh in the background. Google OAuth, durable encrypted offline drafts, background sync, push and store distribution remain unfinished. An uncertain save must be retried while the app is open. Closing the app can lose the in-memory retry key/draft; do not market this as offline-safe capture.

## Local setup (no paid service)

From `mobile`, run `npm ci`. Supply `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` for the existing isolated staging project through the local environment. The anonymous key is public; never use a service-role/provider secret. Run `npm run typecheck`, then `npm run export` to produce separate iOS/Android JavaScript bundles. Bundling is not native compilation or device QA.

`npm run android` requires Android SDK/JDK/emulator or a connected test device. `npm run ios` requires macOS/Xcode. Signing, platform accounts and store publication need verified existing access. Do not purchase accounts or use paid cloud builds without authorization.

Before a native release: test real sign-in/expiry/sign-out, two-account isolation, rotation/background/foreground, accessibility font scaling, keyboard/320px overflow, offline uncertain outcomes/retries, and actual device install. Add secure persistent custody and native OAuth before calling the account experience complete. No price, subscription, checkout or live charge action exists in this prototype.

## Project browsing and recovery

Search filters only the loaded, owner-scoped list (up to 200 active projects); it never changes the selected project. The selected name remains visible even when filtered out. Loading, failed refresh, and verified empty results have distinct messages. Previously loaded data is labeled potentially stale after a refresh failure. New saves require a successful load; retries of uncertain saves retain their existing operation ID and project even if the refreshed project list changes. Older responses are ignored after a newer refresh or account change. These behaviors have source/type and focused logic checks; phone interaction and accessibility checks remain required.

## Review before capture

Time entry now has a local review step: project, duration, start time and note are visible before confirmation. Editing returns to the unsent form. Project/duration/note and refresh are locked during review so the confirmed payload matches the preview; signing out clears it. Confirmation uses the reviewed timestamp (not a later shifted start), and uncertain retries retain that exact payload and operation ID. No RPC is made to prepare a review. Actual device interaction still needs validation.

## Leaving an unfinished entry

Sign-out asks for confirmation if a duration/note, review, or uncertain save exists. An uncertain save takes priority: users can keep working and retry, or explicitly sign out after being warned that the in-memory retry ID will be lost and the original account must be checked before another entry. Canceling changes nothing. Confirmation from an older account/session is ignored. This does not protect against OS termination, forced closure, or session expiry; durable encrypted recovery remains unfinished. Native alert interaction still requires device testing.

## Home overview (0.1.2 candidate)

Signed-in users land on Home. Home and Time tabs remain above the scroll area. Home summarizes only the loaded active projects (up to 200) and latest 20 completed entries, not lifetime work or revenue. The first five projects are listed, with browser links to Clients, CRM notes, Agreements and Invoices; these are not native implementations. Website sign-in is separate.

Tab changes preserve the in-memory time draft, review and uncertain retry operation. Account changes clear that state and return Home. Native TypeScript, mocked navigation/session tests and OAuth tests are separate from actual on-device acceptance. Device installation and visual/accessibility checks remain required. This version does not add offline persistence or full-workspace totals.
