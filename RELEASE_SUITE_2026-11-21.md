# Remaining workspace release

Based on Production 84f66abede9ae681a8716263331e1c64c619430f. Selected existing implementations from 85628ac878c6f0cd83dded33c2fdff8d09593266; not a merge of the broad PR.

## Functioning scope
- Shared navigation and connected client/project overview on the existing agreement dashboard.
- Owner-only CRM opportunities, notes, stage/outcome tracking, reviewed CSV import and filtered CSV export.
- Owner-managed scheduling availability, versioned private intake and bookings. Not a public booking portal.
- Invoice drafts, explicit review/issue snapshots, manual recurring-draft generation and allowance ledger. No charges or automatic invoice sending.
- Invoice/time reports and complete-period CSV exports. Not revenue or accounting reconciliation.
- Team owner/admin/member access, manually shared one-use invitations and shared resource/capacity planning. Existing solo clients/agreements remain private; team membership does not grant access to them.
- Calendar/email readiness and delivery-history UI. Provider activation remains configuration-gated and unverified providers stay unavailable.

## Disabled / unfinished
- Google Calendar OAuth/free-busy requires verified OAuth configuration and encrypted token custody; no calendar writes implemented.
- Transactional email enqueue/dispatch needs keys, verified sender and a separately deployed worker; no worker is scheduled by this release.
- Outlook/accounting connectors, public booking portal, automatic recurring issuance/charging and broader CRM automation are not implemented.

## Preservation
Existing billing/payment routes, authentication flows, SEO/public routes and legacy edge functions are unchanged. PR #2 hydration and workspace noindex are retained. Only seven additive workspace migrations are applied; old migrations are not replayed. No customer records are auto-imported or merged by name.

## Verification
19 API/database test files passed. Optimized Next build and focused browser workflows cover CRM, invoices, scheduling, reports, team and resources; multi-timezone time hydration regression retained. Hosted staging tests verify real JWT account isolation, CRM idempotency, recurring drafts, concurrent allowance debit rejection, scheduling/intake and team resource denial for nonmembers. Synthetic fixtures were cleaned up.
Fresh Production backup restored privately; 56 data tables match hosted fingerprints. Two Supabase internal schema-migration tables are excluded by default dump and not counted as restored data. Exact atomic migration rehearsed; all preexisting local table hashes unchanged. Atomic rollback rehearsed on restored baseline schema. Database restore does not establish object-storage byte recovery.

Private evidence: C:/Users/joshu/mfh-private-backups/suite-release. Contains no public artifacts or credentials in this repository.
