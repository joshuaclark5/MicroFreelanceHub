# MicroFreelanceHub native core prototype

Expo SDK 54 / React Native for iOS and Android; not a WebView, PWA, signed binary, device-tested app or store release. Shares the existing secure Supabase accounts, RLS and `workspace_time_mutate` operation. No new database or alternate billing system.

## Core flow

Existing email/password account → active projects → log completed nonbillable time → refresh latest 20 entries. Reuses `app/lib/workspaceTime.ts`. Revalidates account identity before mutation; retries preserve the same operation ID. Existing database constraints/RLS remain the authorization boundary. No service-role key belongs in the app.

Sessions are **memory-only** in this prototype. They are cleared on process exit; the app suspends token refresh in the background. Google OAuth, durable encrypted offline drafts, background sync, push and store distribution remain unfinished. An uncertain save must be retried while the app is open. Closing the app can lose the in-memory retry key/draft; do not market this as offline-safe capture.

## Local setup (no paid service)

From `mobile`, run `npm ci`. Supply `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` for the existing isolated staging project through the local environment. The anonymous key is public; never use a service-role/provider secret. Run `npm run typecheck`, then `npm run export` to produce separate iOS/Android JavaScript bundles. Bundling is not native compilation or device QA.

`npm run android` requires Android SDK/JDK/emulator or a connected test device. `npm run ios` requires macOS/Xcode. Signing, platform accounts and store publication need verified existing access. Do not purchase accounts or use paid cloud builds without authorization.

Before a native release: test real sign-in/expiry/sign-out, two-account isolation, rotation/background/foreground, accessibility font scaling, keyboard/320px overflow, offline uncertain outcomes/retries, and actual device install. Add secure persistent custody and native OAuth before calling the account experience complete. No price, subscription, checkout or live charge action exists in this prototype.
