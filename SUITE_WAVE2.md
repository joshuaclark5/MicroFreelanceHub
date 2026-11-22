# Suite wave 2 — local additive candidate

Base b25be1f2621c03f7f2a7a3f8136fd290667d3d75, itself unpublished and based on billing candidate8b1cde9. Live reference supplied by requester405af13. No push or deployment authorized.

## Frozen implementation boundaries
Owner-first persistent feature lanes use workspace_clients/workspace_projects composite owner identities; legacy expenses.project_id and payment/invoice routes remain unchanged. Additive migrations are local review proposals only. No providers, external reminders, email sends, automatic charges, tax/legal/accounting certification or fabricated team entitlements. Invoice generation is not payment. Manual allowance balance is not verified cash.

Foundation has no versioned edit or request idempotency and remains capped at1000 listed records; do not infer these are fixed by new feature RPCs. New lane mutations must pin loaded actor identity, version/CAS where editing, and stable operation ID for retryable effects. Financial/audit state is only changed through deliberate authorized transactions, not direct mutable protected columns.

## Evidence and setup
Run scripts/verify-suite-wave2.cjs after all three additive feature commits are integrated. It runs explicit nonincremental TypeScript before/after optimized Next build, foundation regression, lane handler/database tests, ordered combined migrations and protected legacy table checks. Uses already installed dependencies, preinstalled PGlite, fictional loopback configuration. Local .next is NOT a deployment artifact. Browser fixtures are separate and cannot prove production persistence or Supabase JWT/RLS behavior.

Evidence and exact accepted SHA: C:/Users/joshu/mfh-suite-20261118/wave2/HANDOFF.md when populated by integration lead after tests; do not treat this setup document as a pass receipt. Full scope/row status remains ../FEATURE-LEDGER.md outside this worktree.

## Production gates remain open
Authoritative intended Supabase catalog/grants/triggers/functions/auth read-only inspection, migration collision/locking assessment, explicit exact-migration approval, backup/recovery and isolated authenticated staging two-account tests, business access/retention/export/entitlement policy, existing Stripe ownership release gates, independent review and production-owned clean rebuild before separately authorized release. Embedded PGlite serializes queries; burst/constraint tests are not multi-server production race certification.

## Retained dependency order
Finish/review bounded time/local booking/intake/invoice/retainer slices → CRM opportunities/activity and complete formula-safe import/export/search/pagination → approved time/expense allocation and reconciled local financial/operational reports → Google Calendar then Outlook, QuickBooks then Xero (each real authorized sandbox evidence, never adapter-only completion) → actual teams/RBAC/invites, timesheet approvals and resource/capacity planning → genuine iOS and Android app builds/device validation/distribution. Native contract/toolchain work may begin earlier; Windows alone cannot prove iOS signing. All backlog categories remain required; no competitor superiority or calendar ETA is asserted.
