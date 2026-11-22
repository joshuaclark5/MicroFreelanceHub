# Opt-in integrations release

## Implemented
- Private owner-controlled public booking links, anonymous bounded availability/form submission, atomic exclusion with private bookings, persistent abuse limits, explicit consent, rotation and disable controls. No existing customer is enrolled. Public documents are noindex/no-referrer and load no analytics.
- Authenticated bounded email dispatcher and delivery reconciliation. Existing Vercel Pro plan supports the five-minute schedule; one send and one reconciliation maximum per invocation. Existing explicit per-message permission is required. Queued/accepted/delivered/unknown remain distinct; unknown outcomes are never resent automatically.
- Isolated Stripe TEST ONLY subscription sandbox. Dedicated test key, explicit opt-in, synthetic email-free resources, no payment method, two-day trial with automatic cancellation. Existing customer billing and invoices are untouched.

## Verification and rollout
Optimized build and independent TypeScript passed. Public booking passed 13 actual SQL/API/browser groups; worker passed six guarded dispatch/reconciliation groups; test billing passed seven real orchestration groups using fixture transport. Integrated ordered migrations preserve legacy data and enforce RLS/grants.

Fresh private production schema/data/history exports restored into network-isolated PostgreSQL; all 86 exported data/history table fingerprints matched. Three additive migrations and transactional rollback were rehearsed, preserving existing table data. Storage object bytes and two CLI-excluded internal migration catalogs are not included in this recovery proof.

Staging existing schema, functions, grants, constraints and policies matched production across 582 records. Seven previously missing staging history entries were reconciled before applying the three new migrations. Real authenticated staging tests proved owner isolation, public/public and public/private concurrent booking exclusion, retry stability and rotation. Real Resend API accepted one synthetic reminder to its documented delivered@resend.dev simulator; later independent retrieval reconciled it as delivered. This is provider test-mailbox evidence, not a customer-inbox delivery claim. Real Stripe test API creation, refresh and cancellation of an isolated synthetic subscription also passed; the subscription was canceled and live billing was untouched.

Private receipts and deployment checks are maintained outside Git. Production activation must follow schema verification; deployment success alone does not prove public-domain code or provider operation.

## Provider state
A dedicated Google Calendar OAuth web client has been created with production and stable-preview callbacks, separate from the untouched Google login client. Calendar API is enabled. Actual consent/sync verification is tracked separately. Google classifies the required calendar.freebusy scope as non-sensitive; no sensitive or restricted scopes are requested. Outlook currently needs a working Azure sign-in and intended app registration. Accounting roadmap identifies QuickBooks then Xero, but no developer app/company access is configured. Never substitute a mock connection for provider verification.

## Rollback
Disable PUBLIC_BOOKING_ENABLED and email worker/send gates first. Preserve new booking/outbox/history data and encryption keys; application rollback should retain additive tables. The local transactional schema rollback rehearsal is not permission to drop post-launch data. Test billing only accepts dedicated sk_test credentials; never fall back to existing live billing keys.
