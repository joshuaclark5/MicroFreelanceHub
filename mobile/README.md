# MicroFreelanceHub native core prototype

Expo SDK 54 / React Native for iOS and Android; not a WebView, PWA, signed binary, device-tested app or store release. Shares the existing secure Supabase accounts, RLS and `workspace_time_mutate` operation. No new database or alternate billing system.

## Core flow

Existing email/password account → active projects → log completed nonbillable time → refresh latest 20 entries. Reuses `app/lib/workspaceTime.ts`. Revalidates account identity before mutation; retries preserve the same operation ID. Existing database constraints/RLS remain the authorization boundary. No service-role key belongs in the app.

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
