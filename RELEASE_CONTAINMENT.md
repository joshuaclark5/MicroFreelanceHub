# Local release containment — legacy Connect, email and debug

2026-11-18. **Local source containment only; release remains blocked.** This addresses the assigned A1/A2 and debug portion of A6 from ../audit/RELEASE-READINESS-AUDIT.md. No deployment, live configuration, existing database, provider, email, spending, push or commit was performed.

2026-11-19 follow-up: a read-only production catalog check found broad `profiles` grants that permit authenticated users to write billing/Pro fields. The candidate now includes an additive privilege-restriction migration and a fictional PGlite grant regression check. It is not applied to production; real staging REST tests and backup/restore rehearsal are still release gates. Do not treat this code change as live containment.

## Exact changes

- app/api/stripe/callback/route.ts: GET always returns HTTP 503 with error stripe_connect_unavailable and Cache-Control: no-store. No request parsing, OAuth exchange, Stripe/Supabase SDK initialization, secret reads, redirects or database operations. force-dynamic prevents a static availability response. Existing profile bindings are neither replaced nor cleared. Other HTTP methods remain handled by the framework, with no custom side-effectful handler.
- app/components/ConnectStripeButton.tsx: disabled button and explicit unavailable text; no click handler, client ID, OAuth URL or navigation. Existing userId prop contract retained, signed-out rendering remains null. Existing connected-account views and records are not changed; this is not certification of their validity or payout eligibility.
- app/api/debug/route.ts: GET always returns no-store HTTP 503 debug_unavailable. No credential reads, model listing or external request.
- supabase/functions/dunning-email/index.ts, supabase/functions/send-invoice-email/index.ts, supabase/functions/welcome-email/index.ts: all handler requests, including OPTIONS, return no-store HTTP 503 legacy_email_unavailable. No Resend import/client, environment access, body parsing, recipient lookup, queue insertion or sending. Arbitrary payload templates and unreviewed collection/tax assertions have been removed rather than replaced with invented policy. CORS preflight is intentionally unavailable, not a success acknowledgment. Gateways may reject before the handler; gateway configuration is unchanged.
- scripts/test-release-containment.cjs: read-only local actual-source handler and component regression harness; source SHA256 evidence emitted to stdout.

## Intentional regressions and remaining risk

New/replacement Stripe connections and in-flight callbacks cannot finish, even for legitimate users. Old links/bookmarks and forged/replayed requests get the same unavailable response, not a success redirect. This does not disconnect, revoke, migrate or validate existing accounts and does not change checkout, billing prices or payment lifecycle behavior.

Legacy welcome, invoice and dunning messages no longer send. There is no automatic fallback into the new outbox and no delivery/queue success claim. Browser callers may see a generic CORS/network error because preflight is also blocked. Existing caller screens and success copy elsewhere are outside this assignment; review them before release. Do not retry or reroute messages automatically as a workaround.

**Source replacement is not operational containment of an already deployed endpoint.** Existing edge deployments, other projects and the historical cron targeting a hard-coded project are uninspected and unchanged. Legacy SQL may mark reminders sent when net.http_post merely queues a request, even if this handler later returns 503. Returning 503 cannot repair those milestones, stop cron, recall earlier sends or suppress requests to another deployment. No historical migration/configuration was edited. Separate authorized inventory, stopping/replacing unsafe schedules/deployments and reconciliation of delivery evidence remain release gates; no blanket migration replay.

Other audit findings are not resolved by this patch: protected profile privileges/alternate writers, public AI generation/spend controls, recurring payment reconciliation, baseline/drift and independent concurrency proof remain separate work. Existing records were not inspected or repaired.

## Re-enable gates (not authorization to execute)

1. Connect: separately reviewed server-generated high-entropy, expiring, one-use OAuth state bound to verified current user/session and exact redirect/provider context; atomic consumption and conditional account binding, replay/tamper/wrong-account/session-switch denial and approved destination lifecycle. A raw user ID or signed JWT alone is not sufficient. Independent tests and explicitly authorized sandbox integration precede activation; never restore the old callback as a rollback shortcut.
2. Email: separately approved authenticated, authoritative-record/recipient authorization, reviewed neutral templates, consent and sender ownership, escaped/validated content and payment destinations, durable deduplication, current-authority checks, explicit provider-error/unknown-outcome handling and delivery reconciliation. Any integration with the new outbox must be reviewed separately. No replacement legal, collection or tax policy is introduced here.
3. Debug: keep unavailable; any future diagnostic functionality needs explicit authorization and redacted output without public provider calls.
4. Deployment: freeze exact hashes, independently retest, review caller UX, obtain explicit hosting/edge/configuration permissions, inventory and contain every active legacy path separately. A local PASS is not evidence that production has changed.

## Local verification

Executed: node scripts/test-release-containment.cjs — **11/11 groups PASS**, with zero provider, database, network, credential or navigation effects. It transpiles and invokes the actual GET/Deno handlers, tests absent/forged auth, victim state, duplicate/malformed state, denial, repeated callback and switched actor, malformed email bodies, injected HTML/arbitrary recipients/payment URLs and all edge methods including OPTIONS. It also invokes/renders the actual React component and checks disabled state, absent links/handlers and truthful copy. A fictional existing profile remains unchanged, with privileged client construction forbidden; this is absence-of-access proof, not a real database migration/preservation test.

Executed: git diff --check for assigned tracked source paths — PASS (only existing Git line-ending normalization warnings). TypeScript transpilation diagnostics are checked by the harness. No real JWT, Deno gateway, hosted route, browser-runtime, provider or existing database test occurred. Full nonincremental project typecheck and production build are owned by the parent integration gate; not claimed by this narrow child, whose write scope excludes build outputs and configuration. No release-ready claim is made.

## Parent caller follow-up
Source search found a second direct Stripe OAuth launcher in WelcomeWizard. Parent removed its URL/navigation and disabled only the connection action with truthful unavailable text; Continue without Stripe and profile onboarding remain unchanged. Actual component step2 regression passes. Legacy invoice caller correctly checks invocation errors before marking sent; welcome email errors do not block profile onboarding. These existing callers are not proof of live edge containment.
