# Native website parity implementation

## Scope
Bring the website's actual working workflows into native Android/iOS source, using the same backend identities, ownership rules, entitlement checks, records and operation/version contracts. Preserve the currently published Android 0.1.8 internal release. Do not count website shortcuts or a WebView as native parity. Do not turn test-mode website features into claimed live payment capabilities.

## Baselines
- Native branch starts from Android release 170f99a plus web main 8adcf278bc26aba1750775c74c81ca03a5203787.
- Existing native: Google/email sign-in, encrypted session restoration, active-project overview, nonbillable completed-time capture and same-operation retries, privacy/account requests.
- Work isolated in C:/Users/joshu/mfh-mobile-parity-20261125, branch openclaw/mobile-feature-parity.

## Coverage ledger
| Website workflow | Native status | Required follow-through |
| --- | --- | --- |
| Clients: list, contact fields, create/edit/delete | Implemented candidate | Phone interaction/release verification |
| Pipeline stages: order, create/edit/delete | Implemented candidate | Phone interaction/release verification |
| Projects: client/stage links, active/archive, create/edit/delete | Implemented candidate | Phone interaction/release verification |
| Tasks: project link, due date, open/done, create/edit/delete | Implemented candidate | Phone interaction/release verification |
| Record search and paginated loading | Implemented candidate | Large-list accessibility/device checks |
| Client timeline, contact activity and note edits | Not implemented | Reuse timeline snapshot and note operation contracts |
| CSV import/export and workspace setup | Not implemented | Native file sharing/picker and bounded validation |
| CRM opportunities, follow-ups, activity, imports | Not implemented | Reuse CRM validators and idempotent RPC |
| Time: running timers, billable settings, timesheets | Partial: manual nonbillable capture only | Preserve billing units and uncertain-operation identity |
| Scheduling: services, availability, appointments, intake, calendar/day view | Partial candidate: read-only month/day agenda and working-pattern markers | Native booking, availability/intake mutations and device acceptance remain |
| Time off and customer booking link/configuration | Not implemented | Native date/time selection, real public-link sharing |
| Invoices: drafts, items, review/issue, payment status | Not implemented | Versioned invoice workflow; distinguish test billing from live settlement |
| Agreements: templates, editing, linking, signing and downloads | Partial: no native agreement screens | Keep recipient/public signing boundaries and neutral business copy |
| Reports and exports | Not implemented | Scope/completeness labels and currency separation |
| Team, invitations, roles and access | Not implemented | Server-issued invitation/email flows; no client-side authority shortcuts |
| Resource planning | Not implemented | Preserve conflict/admission logic |
| Connections and delivery | Not implemented | Authenticated server endpoints for provider secrets; native OAuth returns |
| Settings, support, privacy/deletion | Partial | Support native changes without losing request handling |
| Subscription purchase/management | Not implemented | Play-compatible digital purchase architecture; no blind Stripe shortcut |
| Public tools, templates and educational content | Not implemented | Inventory individual tools; native presentation and safe generated-copy handling |

## First workspace slice
mobile/src/workspaceRecords.ts uses owner-scoped Supabase queries with server-verified identity before/after operations, exact-count UUID pagination and shared workspaceInput validation. Edits/deletes use the original version. New-record retries retain a generated UUID; reconciliation checks the same record and exact payload rather than upserting. The pending payload is locked after an uncertain outcome. No service-role credential is bundled.

mobile/src/RecordWorkspace.tsx adds the Work tab: four record sections, relational selectors, search/load more, due-ordered tasks, review-before-save, delete confirmation, guarded sub-tab navigation and sign-out warnings. New projects feed the existing Time screen. Draft/retry state remains in memory; do not claim offline recovery.

## Verification
- Mobile TypeScript passed after pagination-completeness strengthening, along with the repeated isolated hosted suite.
- Fixture service tests cover lost responses, duplicate prevention, stale edits, deletion recovery, account changes, pagination and foreign rows.
- Mocked native UI tests cover draft navigation, review without mutation, locked pending payload, exact-operation retry, success reset and missing relation guidance.
- Existing Home tests passed in Play/direct mode; account-help target test passed.
- Isolated hosted staging tests passed for all four record types, completion/version conflicts, idempotent reconciliation, cross-account rejection and deletion. Synthetic accounts/records cleaned up. Hosted evidence retained privately, no device-test claim.
- Signed build, actual native form interaction and updated Play release remain unfinished. This ledger is not a claim of full parity.

## Native agenda follow-up (not yet integrated into published app)
- `agendaData.ts` reads owner-filtered month bookings and active availability plus open tasks. Exact counts detect incomplete snapshots; each category is capped at 500 with explicit partial-view warnings.
- `NativeAgenda.tsx` provides month/day selection, green working-pattern markers, amber appointment counts (9+ visually; exact counts in accessibility labels), purple task markers, day details and due-next tasks. Recurrence exclusions and display timezone are preserved. This is a read-only view, not booking creation, calendar provider sync, or full scheduling parity.
- Fixture checks pass for DST/local-date grouping, recurrence/time off, canceled booking exclusion, foreign records, missing counts, server truncation and account changes. UI checks pass for partial-count accessibility, out-of-order month requests, failed refresh clearing, and hidden-tab loading.
- Hosted staging agenda queries passed with synthetic task due dates, completed-task exclusion and cross-account isolation. All synthetic users/records were cleaned. No hosted scheduling mutations or authenticated-device test are claimed.
- The 0.1.9 build running from workspace checkpoint 5228fa3 does not import this follow-up component. The Day tab is now integrated in follow-up source; another verified binary is still required.
