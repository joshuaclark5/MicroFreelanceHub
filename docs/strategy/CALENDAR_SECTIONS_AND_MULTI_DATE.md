# Scheduling sections and appointment dates

The scheduling management page (`/workspace/scheduling`) has three accessible tabs: Availability, Intake questions, and Add appointment. The same calendar stays mounted above the selected section, preserving its month, selected day, search and timezone. Draft forms remain mounted while hidden; changing sections does not discard drafts. Calendar links still reveal the matching section and load specifically linked records. The separate calendar-only route keeps its existing full filter layout.

The appointment-date dropdown selects up to 31 explicit host-local dates, including dates in different months. Working-pattern mismatches cannot be selected. It does not promise those dates are free: server booking checks remain authoritative. One attendee, intake version, answer set and local start time are used for the selected dates. A repeated daylight-saving time requires an explicit occurrence choice for each affected date; nonexistent local times cannot proceed.

## Partial results and recovery

Each date is a separate existing `book` API operation; this is not an atomic bulk transaction. A frozen batch snapshot gives each date its own operation ID and expected actor/version. Requests execute sequentially. Confirmed dates are removed from the draft. If a response is lost, malformed or a server error, the remaining form locks and **Retry remaining appointments** reuses the exact original request, starting at the first unconfirmed date. It never resends earlier confirmed dates. Other mutations remain disabled while the batch is uncertain.

Once a date has an uncertain outcome, later authentication, account or other rejection responses do not prove that the earlier request failed: its original operation ID remains locked for retry until a receipt resolves it.

An immediate definite client rejection (before that date has any uncertain outcome) unlocks the remaining dates for correction and rechecking; successful earlier appointments remain saved. A failed list refresh after a successful save cannot trigger another create. Actor changes clear loaded records and prevent retries under another account. Retry snapshots currently live in page memory, like the existing scheduling mutation recovery: the uncertainty notice explicitly says not to reload the page.

No schema changes or customer-data test writes are needed. No email, reminder or calendar invitation is sent by these local booking operations.

## Verification commands

- `npm run build`
- `npx tsc --noEmit --incremental false`
- `node scripts/test-appointment-picker-browser.cjs` (isolated real component)
- Set `$env:QA_BASE_URL="http://127.0.0.1:3086"` in PowerShell, then run `node scripts/test-calendar-sections-browser.cjs` (optimized Next build; intercepted synthetic API only)
- `node scripts/test-workspace-scheduling-browser.cjs` (same `QA_BASE_URL`)
- `node scripts/test-scheduling-record-lookup-browser.cjs` (same `QA_BASE_URL`)

The multi-date browser suite covers 320/390/768/1440px, UTC and America/New_York, tab keyboard navigation and draft persistence, compact grid placement, date-picker keyboard/focus, multi-date success, lost-response-after-commit recovery plus failed refresh, definite partial conflict, failed refresh after success, daylight-saving folds, deep links, accessibility and horizontal overflow. Evidence belongs in `artifacts/calendar-sections`; test results must be read separately from deployment/live verification.

## November 25 acceptance

- Final `npm run build` and independent `tsc --noEmit --incremental false` passed.
- The final optimized server passed the new suite at 320, 390, 768 and 1440px in America/New_York, plus 390px in UTC. Zero WCAG A/AA axe findings, horizontal overflow, hydration errors, or real API writes. First calendar-grid top positions are recorded in `artifacts/calendar-sections/result.json`.
- Existing availability/intake/book/cancel flow passed at four widths on the current-source development server, including unchanged-operation retries and account isolation. Focused-record tests passed at 390/1440px, including out-of-order responses, missing records and invalid links. The isolated picker focus regression also passed at 320/1440px.
- Independent read-only recovery review identified an auth/account retry issue; the per-job uncertainty flag fixed it, and final optimized tests cover lost response, failed refresh, expired auth, switched account and restored-original-account retry with the exact same payload/operation ID.
- No production deployment or customer-account mutation is claimed by this local acceptance. Parent release verification remains separate.
