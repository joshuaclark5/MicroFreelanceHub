# Outlook integration checkpoint

Status: **local development adapter, not an enabled integration**.

`app/lib/server/outlookAvailability.ts` reads the primary calendar's expanded
calendarView into timestamps only. It requests no subject, body, attendees or
location, never creates events, and has no route or credential binding. No
customer calendar is accessed by adding this file.

## Verified locally

Run `node scripts/test-outlook-availability.cjs` from the repository root.
Fixture tests cover multiple pages, cancelled/free events, conservative unknown
availability, clipping to the requested window, UTC validation, privacy of
returned values, same-origin/same-endpoint pagination, repeated-page rejection,
bounded page/event/body limits, redacted errors and failure after a partial page.
The adapter never returns a partial snapshot as available time.

## Remaining integration gates

1. Create or identify the intended Entra app. Read-only inspection on November
   22 found no applications in the signed-in Default Directory's All applications
   view. Do not confuse this with all other possible directories/personal apps.
2. Add server-side OAuth with state/PKCE, exact callback allowlist, least delegated
   calendar-read permissions, encrypted token custody, rotation/reconnect and
   owner/generation checks. Do not reuse Google's credentials or overwrite the
   verified Google availability store. Do not enable Microsoft login implicitly.
3. Reconcile availability from both connected providers; do not let one overwrite
   another. Review migration, recovery and account-isolation tests first.
4. Respect provider throttling at the service layer; no tight or automatic retry
   loop is implemented by the adapter. A denied/incomplete read must leave the
   last snapshot stale rather than falsely clearing busy time.
5. Verify actual consent, token refresh, primary-calendar data (including recurring
   and all-day events), disconnect/revocation and booking conflicts in an isolated
   account before claiming Outlook sync. Background/event sync is separate scope.
6. Run full release gates and exact-live-commit verification. Fixture tests and
   a created app registration are not real integration proof.

Microsoft API reference:
https://learn.microsoft.com/en-us/graph/api/calendar-list-calendarview?view=graph-rest-1.0

## Provider inspection in this run

Intuit's saved workspace URL loaded the existing MicroFreelanceHub development
app. Permissions listed accounting and payments; no scope, credential, billing
or production configuration was changed. Sandbox-company access is not yet
verified. The generic myapps route briefly showed the homepage; that was not
proof of a lost login. Reuse the existing app rather than creating another.
