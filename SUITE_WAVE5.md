# Wave5 local connector readiness

This is a narrow local candidate, not a connected/shipped integration or full-suite release. Primary Google Calendar busy-only OAuth/snapshot and transactional Resend outbox are implemented, default unavailable/off without separately configured server custody. Connections & delivery page manages explicit consent, local disconnect, manual sync, message enqueue/cancel/history.

Read CALENDAR_INTEGRATION.md and EMAIL_OUTBOX.md for exact contracts, runtime gates and real limits. No remote event creation/update/delete, deterministic provider event mapping, incremental events/watch channels, scheduled worker or automatic sending is implemented. OAuth and email sandbox evidence remain required. Calendar disconnect removes local custody but does not prove provider revocation. Reminder permission is explicit host attestation, not independently recorded recipient opt-in.

RELEASE_CONTAINMENT.md documents intentional fail-closed changes to legacy unsafe Connect callback, public debug and three legacy email endpoints. Existing payout records, billing/checkout parameters, prices, entitlements and historical migrations are unchanged. Source containment does not change deployed endpoints or cron.

Local tests use actual TypeScript handlers with mocked transport, disposable PGlite SQL and fictional optimized-browser APIs. Not real JWT/PostgREST, separate-backend contention or provider proof. Detailed full release audit and operator runbook are outside source under wave5/audit and wave5/OPERATOR-GATES.md.

Retain all requested CRM, scheduling/intake, time/tasks, invoice/retainer, accounting/reporting, team/resources and genuine iOS/Android scope. Outlook/QuickBooks/Xero and native implementation/device/Mac/signing/distribution remain open. No business policy, comparator-superiority or tomorrow launch guarantee is introduced. Final exact SHA/tests/archive are in wave5/HANDOFF.md. Never deploy a fixture .next build.
