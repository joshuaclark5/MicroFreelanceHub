# Recorded workspace reports

Read-only owner-first report at /workspace/reports; GET /api/workspace-reports. Existing invoice/time tables and their RLS only; no schema, service role, RPC mutation, provider, payment, connector or native-app feature.

## Metric dictionary

- Invoice face value: integer minor-unit total from each recorded invoice, grouped by original currency AND current draft/issued/void status. Issued/void immutable snapshot currency and total are validated; draft document is current. Issue-date filter is inclusive, date-only. Not historical status as-of, payments, receivables, collections, profit or revenue. No currency conversion or cross-currency grand total.
- Recorded time: completed exact seconds grouped by draft/self-approved review status, billable flag and original currency. Whole records belong to their UTC start instant (cross-midnight work is not split). Running entries appear separately with no duration and never contribute hours. Self-approved is not independent team approval. No rate estimates, invoice allocation, payroll or utilization inferred.
- All reported totals drill down to displayed record IDs; source workspaces are linked. No costs or payments imply no profitability/aging/collected-cash figures, not zero values.

## Completeness and consistency

Authenticated getUser and explicit owner filters on each query. Closed query fields and actor continuity on pagination/download. Stable ascending UUID keyset pages, 100 requested rows, exact remaining count required. Clipped pages continue from their last actual ID. Unknown/inconsistent count withholds totals. UI loads all pages before summarizing, checks count drift and duplicate IDs, discards prior data on auth/error/filter reload.

Reads are current and not transaction-isolated across pages; same-count edits/replacements can occur and cannot be certified by counts. Read timestamp is start of request, not an accounting as-of snapshot. Refresh after edits. No claim of multi-backend race or snapshot proof.

CSV rereads the entire date-filtered period, checks every page count and current actor, and fails without a partial file on uncertainty. Bounded at 100 page requests (at most 10,000 records; a server clipping pages may reach this request bound sooner). Narrow dates if the bound is hit. Exports include exact decimal invoice face value, explicitly named minor-unit column, integer recorded seconds, source IDs, statuses, billability, period, read timestamp and basis. Formula-leading text, whitespace/control-leading formulas and embedded quotes are escaped. CSV is a file export only, not a QuickBooks/Xero connection. UI is USD 123.45 / hrs mins, not raw minor-unit amounts.

Presentation uses local reportMoney/reportDuration equivalents in workspaceReports.ts; no temporary shared helper. reportMoney uses exact BigInt decimal conversion, including JPY (0 decimals), KWD (3), and other supported currencies (2).

## Reproduction

- node scripts/test-workspace-reports-api.cjs
- node scripts/test-workspace-reports-db.cjs
- node scripts/test-workspace-reports-production.cjs

REPORT_EVIDENCE selects output (default ../evidence-reports). Production runner explicitly typechecks before/after optimized build using fictional loopback provider configuration, starts/stops its own 127.0.0.1:3083 server, and runs browser fixtures at 320/390/768/1440. Never deploy this fixture build. Browser-only script can use QA_BASE_URL and QA_BUILD_KIND with parent's production preview.

API suite loads actual TypeScript GET with mocked SDK; SQL suite loads same GET with a narrow SQL adapter executing existing actual migrations under authenticated RLS in disposable file-backed existing PGlite. It creates fictional records via existing mutation RPCs, verifies two owners/anon/protected writes and closes/reopens. No live Supabase JWT/PostgREST, production catalog, native app, integration, multi-backend concurrency or full accounting acceptance claim.

## Quick periods

The report UI offers This month (UTC month start through today), Last month (the full previous UTC calendar month), and Last 30 days (today plus the preceding 29 UTC dates). These only select the existing inclusive date filters; they do not change metric definitions, export scope, authorization or stored records. Custom dates remain available. Boundary fixtures: `node scripts/test-report-periods.cjs`; the browser suite fixes its clock and checks all three shortcuts at every viewport.
