# Billing customer ownership hardening (local candidate)

## Scope and authority

The shared server-only `ownedStripeCustomer` helper retrieves the profile-located customer with the server Stripe client and requires an undeleted matching customer ID and exact `customer.metadata.supabase_id === authenticatedUser.id`. A profile row, matching email, session user reference, subscription metadata or `is_pro` is not an independent customer ownership proof. No cache, metadata repair, email-based adoption or foreign-customer edit is performed.

Gated operations: subscription checkout reuse, subscription listing, portal creation (both Manage Billing and Cancel Subscription), receipt lookup, and the toolkit's existing server-side subscription list. The existing customer producer in checkout-plan sets `metadata.supabase_id` from the authenticated user on customer creation; no other source producer/update was found. A missing association can take the existing new-customer path; a present invalid, deleted, foreign or metadata-less association cannot. Provider errors stop downstream work. Checkout authentication errors also fail closed. Provider exception details are not logged by checkout/portal.

No direct cancellation API exists: settings routes cancellation to the same billing portal endpoint. This patch does not add a cancellation operation, change subscription status or grant an entitlement. All existing prices ($9/$29/$79 monthly), amounts, currency, fees, promotion-code acceptance configuration and checkout payload business fields remain unchanged. No browser-side provider call is added. Agreement payment/Connect handlers and webhooks are unchanged.

## Legacy migration decision (not implemented or authorized here)

Missing metadata is deliberately unavailable/denied. Support must not claim a customer because email or mutable profile fields match. Before rollout, an authorized operator must inventory affected associations using a separately approved read-only audit and decide treatment using trustworthy historical server-created checkout/audit records and account identity verification. Any eventual backfill needs conflict detection, explicit reviewed customer/user mapping, dry-run evidence, a separately authorized write window, replay-safe conditional updates and an audit trail. Ambiguous or conflicting associations remain blocked for manual resolution. Do not overwrite another user's metadata or auto-create a replacement for a failing association. This candidate performs no migration and reads no live customer records.

## Production prerequisite: database write restrictions

Source migration `20260420000000_create_profiles_table.sql` permits own-row UPDATE without billing-column restrictions; actual production grants/policies were not inspected. RLS ownership alone is insufficient if authenticated clients can update their own `is_pro`, `stripe_customer_id`, `subscription_id` or `stripe_account_id`. The app guard prevents profile customer forgery from authorizing the listed billing operations, but does not fix direct database writes, self-entitlement changes, clearing an association or Connect destination tampering.

- create/page.tsx reads is_pro and uses it for AI controls, premium payment UI and the free project-count gate.
- dashboard/page.tsx reads is_pro for PRO display and project-count gate; edit/[id]/page.tsx uses it for premium controls. Client checks are not enforcement.
- stripe_account_id remains used by agreement checkout as the transfer destination; separate server-produced Connect identity and database restrictions need review. No charging/fee behavior changed here.
- The signed webhook writes is_pro=true for paid known-plan checkout completion, but does not reconcile the full subscription lifecycle. Existing cancellation/renewal/revocation semantics need separate business approval and integration review; this patch does not invent them.

Before claiming production billing/entitlement security, independently verify or deploy an approved database intervention that removes broad authenticated INSERT/UPDATE privileges over protected billing columns (including insert/upsert paths), preserving only explicitly allowed profile fields and trusted server writers. Review all grants, RLS policies, triggers, views and RPC bypass paths; prove forbidden own-row column mutations and cross-user mutations are rejected via real authenticated REST in authorized staging, while legitimate profile edits, signup, attribution, Connect and webhook writes continue. A separate server-side entitlement enforcement design must preserve the approved business matrix. No SQL or live schema changes are bundled or executed.

## Reliability limits

Ownership verification itself is read-only and repeated requests revalidate. Tests prove repeated denial and sequential new-customer reuse. They do NOT claim concurrent checkout/session idempotence: the preexisting null-profile customer-creation/save sequence can race or orphan a customer on DB failure, and repeated checkout requests still create sessions. Durable create/session idempotency needs its own approved persistence/retry design; a constant idempotency key would silently change checkout behavior and is not introduced.

The metadata binding assumes the server Stripe account/credentials and metadata writers are trusted. Request-time checks cannot eliminate provider-side ownership changes after retrieval. Restricted Stripe keys now need Customers read permission for checkout reuse, portal/list and toolkit as well as receipt. Production deployment must use intended Stripe account/mode and Supabase project. Never deploy a local fixture .next build.

## Independent review corrections and narrow release gate

Independent actual-handler regression expansion found two error-containment gaps: checkout/portal provider constructors could throw at module import when configuration was missing, and subscription authentication could throw outside its catch. Provider initialization is now inside authenticated handler failure boundaries; subscription authentication failures return the existing generic unavailable response. These were reliability/minimization gaps, not a demonstrated ownership bypass. No customer/session payload or financial parameter changed.

Source acceptance is conditional, not production billing certification. The exact deployment key must be tied to the intended Stripe account/mode with Customers READ (new for checkout reuse, portal, list, toolkit), Checkout Sessions READ and Subscriptions READ for receipts/list/toolkit. Existing checkout Customers CREATE, Checkout Sessions CREATE, portal session CREATE and expanded Product READ dependencies must remain permitted. Verify the existing API version and portal configuration in that same account, without creating a customer, portal session or checkout as a permission probe. Dashboard login, variable presence and a successful fixture build are not permission evidence.

Verify production Supabase project binding for public URL/anon and server service-role credentials, cookie-auth configuration, actual profiles columns and own-row SELECT. Separately inspect effective table/column grants, all RLS policies, INSERT/upsert/UPDATE paths and privileged functions/views/triggers for protected is_pro, stripe_customer_id, subscription_id and stripe_account_id. An own-row UPDATE policy is not column protection. No production restrictions have been established by this review. Existing provider-signin blockers remain with the parent; no permission, schema or provider configuration was altered here.

Before a normal billing rollout, approve the legacy missing-metadata support impact, obtain exact configuration evidence, and approve an isolated test-account integration plan. Any staging mutations/metadata backfill/schema intervention require separate authorization. A bounded security-only rollout with unresolved broader profile/Connect risks needs an explicit parent/operator risk decision, not an implicit paid-offer launch. Preserve the fail-closed correction while deciding; never reinstate email adoption to make legacy accounts pass.

## Acceptance

All tests use fictional mocked providers, not real secrets, billing data or transactions. Parent independent review of exact commit/patch is mandatory before any push/publication. No live integration, production RLS, entitlement lifecycle or paid-offer launch certification is claimed. A production paid-plan expansion remains blocked on the restrictions and business decisions above.

## Follow-up: live catalog finding and local mitigation (2026-11-19)

An authorized read-only inspection of the production catalog found that `profiles` has `company_name` (not `business_name`) and that `anon`/`authenticated` have broad profile write grants, including updates to billing/entitlement fields. The integrated candidate now writes onboarding business names to `company_name` and adds `20261118110000_restrict_profile_billing_client_writes.sql` to keep Pro/Stripe fields server-owned while allowing the existing name/company/onboarding edits. The local PGlite schema harness models the old permissive grants and checks the revised column privileges.

This is source-only mitigation. The migration has not been applied to production or a real staging database; real authenticated REST denial tests, signup/profile-trigger verification, webhook/admin-write verification, and a recoverable backup/restore rehearsal remain mandatory before release. This does not resolve other profile writers, Connect lifecycle, billing entitlement lifecycle, or the containment items above.
