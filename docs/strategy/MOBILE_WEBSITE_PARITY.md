# Native website parity implementation

## Scope
Bring the website's actual working workflows into native Android/iOS source, using the same backend identities, ownership rules, entitlement checks, records and operation/version contracts. Preserve the currently published Android 0.1.9/code10 internal release and its exact artifacts. Do not count website shortcuts or a WebView as native parity. Do not turn test-mode website features into claimed live payment capabilities.

## Baselines
- Native branch starts from Android release 170f99a plus web main 8adcf278bc26aba1750775c74c81ca03a5203787.
- Existing native: Google/email sign-in, encrypted session restoration, active-project overview, nonbillable completed-time capture and same-operation retries, privacy/account requests.
- Work isolated in C:/Users/joshu/mfh-mobile-parity-20261125, branch openclaw/mobile-feature-parity.

## Coverage ledger
| Website workflow | Native status | Required follow-through |
| --- | --- | --- |
| Clients: list, contact fields, create/edit/delete | Released in Android 0.1.9 | Broader device/accessibility acceptance remains |
| Pipeline stages: order, create/edit/delete | Released in Android 0.1.9 | Broader device/accessibility acceptance remains |
| Projects: client/stage links, active/archive, create/edit/delete | Released in Android 0.1.9 | Broader device/accessibility acceptance remains |
| Tasks: project link, due date, open/done, create/edit/delete | Released in Android 0.1.9 | Broader device/accessibility acceptance remains |
| Record search and paginated loading | Implemented candidate | Large-list accessibility/device checks |
| Client timeline, contact activity and note edits | Not implemented | Reuse timeline snapshot and note operation contracts |
| CSV import/export and workspace setup | Not implemented | Native file sharing/picker and bounded validation |
| CRM opportunities, follow-ups, activity, imports | Not implemented | Reuse CRM validators and idempotent RPC |
| Time: running timers, billable settings, timesheets | Partial: manual nonbillable capture only | Preserve billing units and uncertain-operation identity |
| Scheduling: services, availability, appointments, intake, calendar/day view | Released partial: read-only month/day agenda and working-pattern markers | Native booking, availability/intake mutations and device acceptance remain |
| Time off and customer booking link/configuration | Not implemented | Native date/time selection, real public-link sharing |
| Invoices: drafts, items, review/issue, payment status | Source candidate: list/detail and reviewed draft creation; not released | Hosted/device acceptance, privacy inventory and next signed release; edit/issue/void/payment workflows still absent |
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
- Integrated 0.1.9/code10 signed APK/AAB, agenda-presence audit and signed-out emulator installation/launch passed on 2026-11-25. Actual authenticated native form interaction and updated Play release remain unfinished. See ANDROID_019_NATIVE_WORKSPACE.md for exact source and artifact hashes; this ledger is not a claim of full parity.

## Native agenda implementation (included in released 0.1.9)
- `agendaData.ts` reads owner-filtered month bookings and active availability plus open tasks. Exact counts detect incomplete snapshots; each category is capped at 500 with explicit partial-view warnings.
- `NativeAgenda.tsx` provides month/day selection, green working-pattern markers, amber appointment counts (9+ visually; exact counts in accessibility labels), purple task markers, day details and due-next tasks. Recurrence exclusions and display timezone are preserved. This is a read-only view, not booking creation, calendar provider sync, or full scheduling parity.
- Fixture checks pass for DST/local-date grouping, recurrence/time off, canceled booking exclusion, foreign records, missing counts, server truncation and account changes. UI checks pass for partial-count accessibility, out-of-order month requests, failed refresh clearing, and hidden-tab loading.
- Hosted staging agenda queries passed with synthetic task due dates, completed-task exclusion and cross-account isolation. All synthetic users/records were cleaned. No hosted scheduling mutations or authenticated-device test are claimed.
- The first 0.1.9 build from checkpoint 5228fa3 does not import Day and remains archived as workspace-only. A separate integrated binary from 2a94f2a now passed signing, bundle/agenda checks and signed-out emulator smoke. Authenticated Day/Work device acceptance and store publication remain unverified.


## Verified release checkpoint ? 2026-11-25 17:28 UTC

The preceding implementation/test chronology predates publication. Play Console verified **0.1.9/code10 active, available to internal testers** after uploading only the preserved production AAB from `2a94f2a`. Existing two testers unchanged. Signed-in Work/Day/save/session restoration passed using a staging-only test variant; source/mock sign-out plus real storage-adapter checks passed. Final native sign-out remains unverified under emulator RAM pressure, disclosed in release notes. Public Work/Day privacy wording is live. This supersedes older statements above that upload or signed-in acceptance remains entirely unfinished; it does not imply full device acceptance or website parity.

Private receipt: `C:/Users/joshu/mfh-overnight-evidence-20261125/ANDROID_019_PLAY_RELEASE_RECEIPT.json`. New invoice source after the release commit is not in 0.1.9. Any next release requires a new version/code, fresh acceptance and updated applicable privacy/store disclosures. No additional upload was performed by this continuation.

## Invoice / iOS continuation ? 2026-11-25

Implemented and independently reviewed native invoice list/detail and reviewed draft creation, with account-fenced private UI, exact currencies, immutable retry identity and sign-out/draft coordination. Source/fixture tests pass; see `NATIVE_INVOICES_CANDIDATE.md`. This is not full native invoice parity and is not in the released 0.1.9 package.

The iOS JavaScript/Hermes export passed with explicit `appstore` mode, one Metro worker and unchanged candidate source digest. No IPA, Apple signing, iPhone test or TestFlight upload occurred. Login/deletion policy, account/team/build access and platform-native testing remain outstanding; see `IOS_READINESS_20261125.md`.

Website PR45 separately fixed invoice account-change display custody and uncertain-save editor overwrite, with production build/TypeScript and four-width/axe fixture checks. Public code for merge `d248efeea00a173e5f05996017c196c316ec9f89` verified. This is a concrete correctness improvement, not proof of superiority to HoneyBook. Full feature/subfeature comparison remains incomplete.
