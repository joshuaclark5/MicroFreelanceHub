# Agreement Experience Upgrade

Owner: Joshua. Updated September 29, 2026. Status: tested preview, NOT deployed.

## Scope

Agreement software first: guided drafting, client signatures, change orders and
connected Stripe payments. Keep free resources secondary. Preserve public URLs,
useful search content and existing pricing. Do not promise legal outcomes,
guaranteed payment, conversion rates or search index counts.

## Implementation

- [x] Isolated upgrade branch; preserve unrelated work in original checkout.
- [x] Save tested September 21 implementation as a Git checkpoint.
- [x] Rebase checkpoint onto current origin/main, retaining newer articles.
- [x] Free guided project/scope/review flow and direct editor option.
- [x] Carry price, scope and timeline into agreement editor.
- [x] Agreement-first dashboard with expandable financial overview.
- [x] Guard editor initialization and fix feedback widget overlap.
- [x] Homepage agreement-first entry point and real product walkthrough.
- [x] Readable template previews, simpler headings and resource-library backlink.
- [x] Session-scoped guided brief recovery after refresh (24-hour expiry).
- [x] Editor draft recovery across navigation; authenticated recovery preserves client email, total, due date and payment schedule.
- [x] Conversion events with fixed payloads, no client names, emails or agreement text; respect DNT/GPC.
- [ ] Final navigation, keyboard and accessibility pass across core screens.
- [x] Verify signature, change-order, payment confirmation and partial balances using mocks and isolated PostgreSQL.
- [x] Desktop/mobile functional regression suite; client payment screenshot reviewed.
- [x] Recompare sitemap URL inventory: 1,510 live and preview, zero missing URLs.
- [x] Balance-aware reminders and no repeat/older reminder after latest milestone (isolated PostgreSQL, mocked mail queue).
- [ ] Complete final visual/accessibility review across remaining core screens.
- [ ] Install and verify both September 29 database migrations with authorized database-admin access.
- [ ] Reconcile outstanding legacy Stripe checkout sessions before rollout; verify live schema compatibility.
- [ ] Final release commit, deployment and public smoke tests.

## Verification

September 21 checkpoint passed production build, independent TypeScript check,
guided flow tests, mocked dashboard tests and previous QA regression suite.
September 28 edits require fresh verification; do not treat older tests as proof.
The sitemap comparison checks route preservation, not Google's actual index.
Dashboard mock tests are not real-customer or live-payment verification.

## Release Boundaries

No pricing or subscription entitlement changes are included. Stripe confirmation,
server-calculated checkout amounts and signature authorization are hardened in this preview.
No live customer records, charges, email or signatures should be created by QA.
Do not describe partial preview work as the completed redesign.

## September 28 Release Blocker: Payment Verification

Read-only code review found existing defects outside the visual changes:

- `app/api/sow/mark-paid/route.ts` accepts a document ID and updates Paid using
  the service-role client without verifying a Stripe payment or authorization.
- `app/api/stripe/checkout/route.ts` accepts the browser's requested amount
  instead of deriving the payable amount from the stored agreement.
- `app/sow/[id]/page.tsx` treats `payment=success` as proof of payment and calls
  the above endpoint. A redirect parameter is not payment evidence.
- `app/api/webhooks/route.ts` handles subscription upgrades, not a complete
  agreement deposit/installment payment ledger.

Do not deploy this broad release until payment verification is repaired and
tested. Required: server-calculated amounts, Stripe session/document binding,
verified payment status, idempotent webhook/reconciliation, partial-payment
accounting, and mocked or Stripe-test-mode failure/replay tests. No live payment
or exploitation tests were performed. Pricing changes remain out of scope.

September 28 QA: guided flow, refresh recovery, Clear/Undo, mocked dashboard and
signup recovery, existing template/billing regression suite, and draft/privacy
unit tests passed. Sitemap: live 1,510, preview 1,510, zero missing or added URLs.
Final build and screenshot pass still required after the latest source edits.

## September 29 Verified Checkpoint

The payment defects above are repaired in preview code, not production. Fresh
production build and separate TypeScript check passed. Guided flow, dashboard
recovery, change-order confirmation, public template/search regression, billing
authorization, draft/privacy and client payment-view tests passed. Stripe and
database browser writes were mocked. Both new SQL migrations passed isolated
PGlite tests, including receipt replay, protected financial/signature fields,
partial balances, remaining-balance reminders and repeat-reminder suppression.

Client-link copying no longer opens a Stripe checkout, and sending a client link
no longer changes agreement/signature status. Full recurring-invoice/refund
reconciliation is not implemented by this checkpoint and must not be advertised.

Release remains blocked: live receipt schema was absent at the last read-only
check. No database-admin credential is configured in this worktree. Managed
browser startup failed with a CDP endpoint ownership error. No production
migration, deployment, customer payment, signature or email was performed.

Local preview: http://localhost:3036 (only reachable on this computer).
