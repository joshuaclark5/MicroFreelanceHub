# Wave4 bounded team and resource candidate

Built locally on5d0c9b207daad039914ff0955ffa24913997ed12 in isolated feature/suite-wave4-integration. Not published or migrated remotely.

## Added
- Separate persisted team membership owner/admin/member, explicit verified recipient invitation acceptance, hashed one-use expiring/revocable tokens, current authorization on access, last-owner protection and recipient-accepted ownership proposal. No email delivery.
- Separate workspace-owned planning projects, weekly capacity and assignments in integer minutes; hours/minutes forms, overbooking visibility, retained unassigned work on member removal. No solo data sharing or finance/time mutation.
- Sage/evergreen editorial team/resources screens in existing navigation, account pinning and deliberate uncertainty recovery.

## Scope limits
All team members read deliberately shared planning; no finance/client/project-manager or assigned-project-only role. No team timesheet approval/utilization, leave/working-day calendar, payroll, accounting, seat billing or entitlement implementation. No providers or native app. Existing solo source, policies, billing/pricing/config/dependencies unchanged except additive navigation.

## Verification
Run scripts/verify-suite-wave4.cjs for actual handler/PGlite regressions, explicit nonincremental types, source preservation, ordered schema and optimized build. Supported offline font fixture exists outside source to reuse original cached Inter bytes; this fixture build is nondeployable. Browser scripts accept local BASE_URL and use fictional intercepted APIs. All evidence and exact final-source receipt live in ../HANDOFF.md, ../verification, ../production-browser and manifest.json.

PGlite is file-backed persistence/RLS proof against a fictional auth schema, not independent-backend contention or real JWT/PostgREST. Browser interception is not end-to-end live auth. Real provider, signing/distribution, staging migration/recovery and publication gates remain. Full capability ledger and exact remaining dependencies are in the evidence root; no whole-category or competitor superiority assertion.
