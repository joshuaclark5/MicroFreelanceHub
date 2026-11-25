# Android Play listing draft - 0.1.9 integrated workspace and Day candidate

Local draft for the integrated source only. Not submitted, approved or published. The archived first 0.1.9/code10 binary is workspace-only and does not contain Day. Match this copy to a newly verified integrated artifact before use. Authenticated-device screenshots and workflows remain unverified.

## App name

MicroFreelanceHub

## Short description

Manage clients, projects and tasks; view your day and log completed work time.

## Full description

Keep your client work organized with MicroFreelanceHub.

Sign in with Google or your existing email password. Use Work to add, edit and manage clients, pipeline stages, projects and tasks in the same account as the website. Link projects to clients and stages, assign tasks to projects, and track task due dates and completion. Review changes before saving. Search and ordering cover loaded records; load more when a list is incomplete.

Open Day for a read-only month calendar and daily agenda. See saved MicroFreelanceHub appointments, working-hour patterns and dated open tasks, plus an earliest-due-first task list that includes overdue work. Appointment times use the displayed timezone and show elapsed duration. Working-hour markers are a pattern preview, not a promise that a booking slot is free. External calendar events and canceled appointments are not shown. The app warns when a category exceeds its 500-record display limit.

Home shows up to 200 active projects and your latest 20 completed time entries. In Time, record completed work against an active project: enter the duration and an optional note, review, then save. Entries recorded here are nonbillable; saving time does not create an invoice or charge a customer.

If a save cannot be confirmed, keep the app open and retry the same operation to check its result. Unsaved drafts and pending retry details are held in app memory, not retained for offline recovery, and can be lost when the app closes or you sign out. An internet connection is required to load or save work.

This early app does not yet include all website features. Day does not create bookings, change availability or connect external calendars. Native invoice, payment, agreement/signature, CRM, team administration and subscription-purchase workflows are not included.

Privacy information and an account-deletion request action are available in the app. The request action opens an email draft to admin@microfreelancehub.com; it does not send automatically or complete deletion.

## Internal tester release notes - integrated candidate only

New Work tab: manage clients, pipeline stages, projects and tasks. New Day tab: view saved appointments, working-hour patterns and tasks due next. Times include timezone and duration. Review changes before saving; keep the app open to retry an unconfirmed save. Day is read-only and excludes external calendars. Many website features are not yet native. This update is an early internal test, not full website parity.

## Submission worksheet - internal, not listing text

- Category candidate: Business. Verify the actual Console selection.
- Support contact: admin@microfreelancehub.com. Joshua authorized monitoring, and the prior release recorded inbox access and live support/privacy alignment. A mail draft is not delivery or request fulfillment.
- Privacy resource: `/privacy-policy`. Its broad collection section covers workspace content, but the Android-specific storage paragraph still describes only project/time use in this checkout. Parent owns the website update; verify the live text before rollout.
- Deletion resource: retain the existing public request path and monitored address. Verify current visibility/handling; do not claim automatic deletion or cancellation of billing.
- Reviewer/test access: use a dedicated non-customer account with fictional data. Exercise client/stage/project/task creation and edits, Day timezone/agenda, time review/save/retry and account switching. Keep credentials out of the repository and listing.
- Screenshots: capture the exact signed integrated Play candidate with fictional data. No new authenticated Day/Work device screenshots were verified by this draft. Do not use workspace-only or conceptual screens to advertise Day.
- Data Safety/content rating/target audience/ads: reconcile the current Console answers against `ANDROID_DATA_FLOW_INVENTORY.md`, dependency/provider evidence and the final artifact. No declaration is accepted or changed by this draft.
- Version mapping: source config is 0.1.9/code10; last recorded published internal release is 0.1.8/code9. Recheck Console before uploading to avoid code reuse or duplicate actions.
- Public production remains subject to the account's closed-testing requirement, setup and Google review. An internal update does not itself meet those requirements.

## Evidence boundary

Source: mobile/App.tsx, mobile/src/workspaceRecords.ts, RecordWorkspace.tsx, agendaData.ts, NativeAgenda.tsx and workflow.ts. Fixture/source checks establish the implemented candidate behavior, not authenticated-device acceptance, store approval or complete parity. No customer data, emails, payments or Console forms were changed by this document update.
