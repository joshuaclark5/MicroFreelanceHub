# Android data-flow inventory for Play review

Updated 2026-11-25. The integrated Work/Day release **0.1.9/code10 is active for internal testers** per the preserved Play release receipt. The table below describes that baseline; the separate invoice addendum describes newer, unreleased source. This is evidence for reviewing store disclosures, NOT a submitted Data Safety declaration or a policy-approval claim. Do not apply candidate claims to the released binary.

## Distribution and current support scope

Play mode omits website signup/recovery, project/workspace shortcuts and the general support website link. Google account creation and existing email sign-in remain. Privacy opens the public website; deletion opens an email draft to the approved admin@microfreelancehub.com address. Prior release notes record mailbox access and support/privacy contact deployment. Opening a mail app is not sending, inbox delivery or deletion fulfillment. This lane did not inspect or change current Play Console Data Safety answers.

## Account-linked native flows

| Surface | Observed source behavior | Evidence / disclosure follow-through |
| --- | --- | --- |
| Email/password sign-in | Credentials passed to Supabase Auth; password field cleared after successful sign-in | App.tsx; review authentication/provider handling separately |
| Google sign-in | Browser authorization with PKCE; identity returned through Supabase Auth | googleSignIn.ts; sign-in is not Gmail, Drive or Calendar authorization |
| Saved sign-in | Session stored through Expo SecureStore; no plaintext fallback on secure-store failure | nativeSessionStorage.ts and encryptedSessionStorage.ts; verify final artifact backup rules |
| Clients | Owner-scoped reads and create/update/delete of client name, email, phone and notes | workspaceRecords.ts plus shared workspaceInput; these are user-entered business contacts, not device address-book access |
| Pipeline stages | Reads/writes stage name and ordering | workspaceRecords.ts; account-linked organizational content |
| Projects | Reads/writes project name, client/stage references, notes and active/archive status | workspaceRecords.ts; Work uses bounded pages; Home separately shows up to 200 active projects |
| Tasks | Reads/writes title, project reference, notes, due date and open/done status | workspaceRecords.ts; free-text task content can include customer information |
| Day appointments | Reads owner/version metadata, attendee label, start/end instants, original timezone and status from saved MFH bookings | agendaData.ts explicitly selects only these fields; intake answers and intake-form IDs are not requested. No booking changes or external calendar-provider calls occur in Day |
| Day working patterns | Reads active rule titles, timezone, weekday/times, recurrence and scheduling settings from MFH records | agendaData.ts; display is a pattern preview, not available slots or connected-calendar synchronization |
| Day tasks | Reads open task title, due date, status and identity/version metadata | agendaData.ts; no task notes are fetched by Day. Each agenda category is bounded and incomplete results labeled |
| Time history | Reads latest 20 completed entries: project ID, note, duration and start time | workflow.ts; notes may contain personal/customer information |
| Manual time save | Sends owner identity, operation ID, project, note, times and nonbillable accounting fields to Supabase RPC | workspace_time_mutate; no invoice or charge created by native capture |
| Draft/retry state | Work and Time drafts, pending payloads and retry IDs remain in component memory | App.tsx and RecordWorkspace.tsx; quitting/signing out can lose them. This is not a durable offline queue |
| Privacy/deletion help | Opens the website privacy resource or the user's mail application with recipient/subject | Does not automatically send content, cancel billing or complete deletion; support handling remains operational |

## Source permissions and dependencies

No new native dependency or Android permission was introduced for Work or Day. These features use Supabase records already associated with the signed-in account. They do not request the device Contacts or Calendar permission. No native payment, invoice, subscription purchase, camera or media-picker flow was added to the released 0.1.9 baseline. The newer invoice source is described separately below.

The previously inspected source manifest requests INTERNET and VIBRATE and explicitly removes external-storage read/write, overlay and microphone permissions. Verify the newly built merged APK rather than inferring final permissions from source. No location/camera/contact access or analytics SDK calls were found in the earlier bounded app-owned scan. This is NOT proof that SDKs/providers collect no diagnostics, IP addresses or other technical data.

Expo update metadata is disabled in the existing native manifest. SecureStore uses device-only/unlocked semantics; inspect final Android backup XML before making artifact-level claims. Observed account/workspace requests use HTTPS. This inventory is not an audit of every dependency or provider retention policy.

## Disclosure review for the update

- Update the Android-specific privacy description to include native client/project/task management, saved appointments/working patterns, and memory-only workspace drafts/retries. The broad privacy collection section already mentions client contact details, notes, tasks, availability and intake answers; do not imply that this candidate reads intake answers merely because the website may process them.
- Reconcile account identity and user-entered client contact details with the applicable personal-information fields in the current Play form. Document workspace notes, tasks, scheduling and other user-generated content accurately. Device address-book/calendar access is different from reading user-entered business records from Supabase.
- Review collection/sharing purposes, optionality, processing/retention, service-provider treatment and deletion answers using actual provider behavior and current Console definitions. Do not automatically answer no data collected or no sharing from this source inventory.
- Keep listing and screenshots consistent with the exact integrated binary; do not advertise native booking changes, external calendar sync, invoice/payment/signature flows or full website parity.
- Preserve public privacy/request access and monitored-contact handling. A prior successful inbox check does not prove fulfillment of future requests.
- Current Console declarations, final integrated artifact behavior, authenticated device workflows and reviewer access remain separate verification steps. No forms or operational policies were changed by this document.

## Unreleased native invoice addendum

Candidate source: `d9d885494b4c95ab3ea8448d8ac220937286dafb`. The following is a source inventory shared by Android and the iOS JavaScript candidate, not a signed artifact inspection, submitted Apple privacy label, or Play Data Safety answer. Play 0.1.9 does not contain this workflow. See `NATIVE_INVOICES_PRIVACY_REVIEW.md` for exact fields, proposed public copy and remaining disclosure gates.

- The Invoices tab reads account-owned saved invoice documents, amounts, dates, status/version/number and issued snapshots. A saved snapshot includes client name **and email**, even though the current detail view does not display the email. Do not confuse minimized client/project selectors with the complete invoice response.
- Reference selectors fetch client/project names, IDs and ownership/relationship IDs only; they do not fetch current client email, phone or notes.
- Reviewed draft creation sends seller details, client/project references, currency, dates, line descriptions/quantities/prices and optional memo through the existing authenticated Supabase invoice RPC. Seller/details/memo may contain personal or business information.
- Unsaved invoice forms, reviewed payloads and uncertain-save operation IDs remain in app memory across tab changes, not in a durable offline queue. A successful save stores the draft and server deduplication receipt remotely. Leaving the app does not delete those saved records.
- No invoice email, payment, bank/card entry, tax calculation, invoice editing/issuing/voiding, document download or extra device permission is introduced by this bounded native workflow.
- Account-linked invoice content and transaction-related amounts need review under each store's current definitions; this inventory does not assume that absence of card collection means absence of financial information. Provider processing/sharing, purposes, retention and deletion semantics need the same review.
- Public privacy wording, exact replacement artifact/network behavior and applicable Console/App Store answers must be reconciled before release. No store declarations or public policies were changed in this addendum.
