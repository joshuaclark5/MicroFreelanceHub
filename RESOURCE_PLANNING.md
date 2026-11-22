# Separate shared resource planning — local wave 4 candidate

## Boundary
The resource screen uses shared team membership, not solo workspace clients or projects. Four new tables hold planning projects, weekly integer-minute capacity, assignments and actor/workspace-scoped operation receipts. No solo policies or records are broadened; no provider calls, emails, tracked time, billing, payroll or accounting records are created.

All members read planning; only current owners/admins mutate. GET and POST pin the original actor. The UI bootstraps its actor/workspace list using the existing team endpoint, then pins every resource request. Unknown fields, non-Monday weeks, fractional minutes and out-of-range values are rejected in both domain and SQL boundaries. Complete snapshots stop visibly at 500 projects, 1,000 members/capacity rows and 2,000 weekly assignments rather than displaying partial totals.

## Membership and concurrency contract
Apply 20261118070000_workspace_team.sql before 20261118080000_workspace_resources.sql. Both mutations lock the same team_workspaces row; resource snapshots take a share lock. Current role is checked after locking and before receipt replay. Capacity inserts use expectedVersion=0; changes require the observed version. Assignment changes/removal and project rename use version CAS.

Composite membership and project/workspace foreign keys forbid cross-team references. A BEFORE DELETE team_members trigger retains planned work, nulls only its removed assignee and increments its version. Capacity cascades away. Unassigned work remains clearly labeled for deliberate reassignment. This also prevents an old assignment editor overwriting the removal unnoticed.

Operation receipts are scoped to actor + workspace + operation UUID with full bounded request equality. In-memory pending UI requests survive uncertain responses and retry the identical operation. Keep the tab open until resolved; pending requests do not survive tab closure. Revoked/demoted users cannot replay prior privileged receipts.

## Local evidence
Run:
- node scripts/test-workspace-resources-api.cjs
- node scripts/test-workspace-resources-db.cjs
- node scripts/test-workspace-resources-browser.cjs

Default evidence: ../evidence-resources. Browser defaults to the actual isolated React component with fictional intercepted APIs; BASE_URL can target an existing Next preview. It uses installed Playwright/axe paths, 320/390/768/1440 viewports, keyboard activation, 200% CSS text reflow and screenshots. No Next dev service is required or started by default.

Verified locally: 8 actual handler/domain groups; 17 file-backed PGlite groups exercising actual team removal/role RPCs, RLS roles, stale versions, revoked access, removal/reassignment, composite foreign keys and reopen persistence; four browser widths with 40 axe-checked screenshot states. Desktop planned-week and 320px overbooking captures visually inspected. Full tsc --noEmit --incremental false exited 0; parent owns the full integration build.

## Limits
PGlite is a single serialized embedded backend with a fictional auth schema, not live Supabase JWT/PostgREST or multi-backend race proof. Browser APIs are fictional; browser reload is not database persistence evidence. CSS text enlargement is not OS/browser zoom certification. No production migration, publish, live provider action or whole-category completion claim. Member labels use shortened IDs, because private profile details are not shared. Project renaming is supported by the backend but not exposed in this first screen; archive, history, bulk planning and future-week copying remain outside this slice.
