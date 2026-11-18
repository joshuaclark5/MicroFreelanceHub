# Connected workspace — local candidate

Base: 8b1cde92e48c65abe48ea1a61c60a073004cfc81 (unreleased reviewed billing ownership source). This is not the deployed 405af13 source and must not be published as an isolated frontend-only update.

## Implemented bounded slice

Dedicated /workspace/clients, /projects, /stages, /tasks and /agreements (all beneath /workspace) provide persistent CRUD through cookie-authenticated server handlers. Clients own project relationships; owner-defined ordered stages track project pipeline; tasks have open/done state, dates and next-action selection. Projects support active/archived classification. Agreement links are explicit, reversible and never rewrite agreement scope, money or signatures. Existing agreement dashboard gains a small real-record project bridge; legacy name groups remain labeled legacy and are never automatically merged into CRM identities. No production demo seed or localStorage CRM exists.

New workspace tables: workspace_clients, workspace_stages, workspace_projects, workspace_tasks, workspace_agreements. Owner-first tenancy uses auth.users.id, not editable profile data, subscription flags or a fabricated team membership. Composite foreign keys include owner_id on every relationship, including agreement id + user_id. RLS is enabled and forced, anon/public access revoked, authenticated access limited by auth.uid(); record identity cannot be reassigned. No service-role client is used in the new API. Every write validates a closed field allowlist and same-origin JSON request. Errors are contained, saves appear only after returned records, and failed forms retain text.

## Deliberate bounds

- Pipeline is an ordered project list with stage labels and editable stage selection, not a drag-and-drop kanban, sales forecasting or automation engine.
- No team entitlement, subscription/project quota or price is invented. New records are an implementation capability, not an offer claim. Business-approved access/entitlement decision is a deployment gate.
- Read lists are explicitly capped at 1,000 with visible truncation. Full pagination and server search are next scaling work, not silently claimed complete.
- No conflict/version merge or idempotency key yet. A transport failure after commit is uncertain: the UI pauses saving and requires explicit reconciliation acknowledgment before retry. Draft text stays in the open tab; save-time session expiry offers a new-tab sign-in and explicit session recheck without automatic writes. This is not durable offline draft storage. No optimistic success is emitted.
- Task time tracking, scheduling, intake, recurring billing, accounting connectors, analytics/reporting, team resources and native apps remain in the full FEATURE-LEDGER.md outside this source worktree.
- Notes are plain text rendered by React; no HTML execution, external email or automation.

## Schema audit and rollout (not executed live)

Existing source has profiles, invoices, sow_documents, expenses and payment receipt dependencies, but no authoritative initial sow_documents/expenses creation migration. expenses.project_id refers to agreements, not this new project table: it is intentionally unchanged. Production schema, grants, policies, views, RPCs, triggers, actual auth projects and owner associations remain unknown without separately authorized read access. New names avoid pretending existing expense IDs are projects.

Migration 20261118000000_connected_workspace.sql is a review proposal tested only against disposable PGlite. It adds five namespaced tables and a unique(id,user_id) agreement key; no existing data is backfilled or edited. It can require a lock/index build on existing agreements; assess table size and maintenance window. scripts/workspace-review provides rollback and explicit mapping review aids; do not execute blindly. Export and verify new data before any separately authorized rollback. Legacy client-name/email matching is not identity evidence. Owner must review exact IDs before any mapping.

## Production acceptance requirements

1. Independent exact-SHA source/security/UI review; preserve reviewed base billing prerequisites in mfh-premium-20261118/billing-review/REVIEW.md.
2. Authorized Supabase read-only introspection of intended project and deployed tables/types, existing constraints, grants, all policies, functions, triggers and auth/users dependencies. Resolve naming collisions and missing baseline migrations. Confirm authenticated SELECT rights on own agreements and index/lock plan.
3. Business-approved workspace access/entitlement semantics and retention/export/deletion policy; do not infer from mutable is_pro or claim unlimited plan limits. No pricing change included.
4. Separately authorized staging schema application, backup/restore/rollback rehearsal, real cookie-auth own-row CRUD and two-account cross-owner direct PostgREST/FK/RLS denials, auth expiry/relogin and migration-absent compatibility.
5. Validate full legacy agreement/signature/payment paths and owner-changing constraints under actual privileged writers. Existing Stripe/Supabase production sign-ins and billing gates are unresolved, not waived.
6. Explicit deployment/migration permission, production-owned clean rebuild (never deploy fictional .next), controlled release and post-release checks. No publication, migration, customer writes, account creation, spend or price changes occurred in local development.

## Local verification

Run TypeScript separately (Next config skips integrated type/lint validation), npm run build with fictional loopback provider config, actual-handler VM tests, file-backed disposable PGlite tests and browser fixture matrix. Browser mocks establish interface behavior only; PGlite proves relational persistence and isolation, not live Supabase/PostgREST behavior. No lint certification is implied.
