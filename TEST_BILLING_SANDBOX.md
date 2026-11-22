# Recurring billing TEST MODE ONLY sandbox

Dedicated page: /workspace/invoices/test-billing
Dedicated endpoint: /api/workspace/test-billing

Disabled by default. This is an isolated synthetic experiment, not customer recurring billing.
Existing invoice scheduling, customer records, application plans, payment links, webhooks and SEO routes are unchanged.

## Configuration and release

Apply migration 20261121020000_test_billing_sandbox.sql through the normal reviewed migration process.
Server-only configuration names (never expose their values):
- STRIPE_TEST_BILLING_ENABLED=true
- STRIPE_TEST_SECRET_KEY: a dedicated sk_test_ key from an isolated Stripe sandbox
- STRIPE_TEST_APP_ORIGIN: exact HTTPS origin, without trailing slash (http://localhost is supported for local development)
- Existing NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for the separate server-only resource table.

No fallback to STRIPE_SECRET_KEY. Live keys, restricted keys, malformed keys, disabled configuration, missing mode flags and live response objects fail closed.
Use an isolated Stripe sandbox with no email destinations or external event forwarding configured. Do not attach production webhook endpoints to this sandbox.
Do not configure a key during build; configuration is checked at request time.

## Behavior

Verified Supabase user identity owns exactly one sandbox record. Explicit checkbox consent is required before creation.
Mutations require exact same origin and expected authenticated actor. API accepts no customer IDs, card data, emails, prices, secret keys or existing subscription IDs.
A synthetic customer (without email), synthetic product and $1 USD/month subscription are created only in test mode.
The subscription has no payment method, a two-day free trial, and an explicit cancellation timestamp at trial end.
No Checkout session, invoice-send call, real charge or application entitlement update is performed.
Refresh reads the actual Stripe test subscription. Cancel immediately cancels only the stored, owner-marked test subscription.
There is no automatic enrollment or background job.

The independent service-role-only table has RLS enabled and no anonymous/authenticated grants.
Owner uniqueness and stable operation-derived Stripe idempotency keys protect repeated and concurrent creation.
Each resource is saved before the next step; retry after unknown outcomes with the same operation.
Fixed trial timestamps make retry parameters stable. Creation refuses incomplete records after 23 hours, before Stripe's 24-hour idempotency retention floor.
Never delete/reset an unresolved record to retry: an operator must inspect the isolated Stripe sandbox using the opaque sandbox_operation metadata and reconcile its IDs.
Cancellation leaves the synthetic customer/product and tracking row as audit evidence. There is no reset or recreation UI.
If a response is lost, retry the same action; GET displays only cached status and does not claim fresh provider verification.

## Verification

Run: node scripts/test-test-billing.cjs
Run: node scripts/test-test-billing-route.cjs
The tests execute production parsing, key/mode guards and resource orchestration against a fixture transport; they are not proof of a working provider.
Run npm run build before release.
Manual configured smoke: sign in, opt in, create trial, refresh from Stripe, cancel, refresh again; inspect only synthetic test resources and the independent tracking table.
Check a second owner cannot access the first owner's resources; cross-origin POST and actor mismatch must fail.
No dedicated test key was available during implementation, so no provider resources were created and no actual Stripe verification was claimed.
Migration execution and authenticated UI/browser verification remain release checks.
