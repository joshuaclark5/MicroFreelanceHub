# UX and acquisition polish

## Implemented

- Dashboard filters now have borders and selected states. Settings/actions have
  44px targets and keyboard focus. Cards no longer hide navigation in a clickable
  div: Open agreement, Edit draft/Change order, Copy link and Email client link are
  explicit actions. All existing functional menu actions remain available.
- Removed the nonfunctional bulk Duplicate control and the direct database
  Mark Paid control, which conflicts with verified payment protection. Verified
  Paid agreements no longer incorrectly display Deposit Paid/Part Paid labels.
- Narrow dashboard navigation wraps; footer links wrap without horizontal overflow.
- Email signup stores sanitized acquisition metadata for confirmation on another
  device. Immediate email sessions and returning password logins go through the
  existing server callback. Conditional profile updates preserve first-recorded
  attribution instead of overwriting it on subsequent login. Attribution is not
  authorization, and no new GA event is inferred from success-page visits.
- Existing mobile-mechanic, gutter-installer and parking-lot-striper template
  pages have specific job-detail checklists and attributed agreement actions.
  These are focused entry-point improvements, not a completed A/B experiment.
- Homepage and editor receive route-scoped canonical URLs, including parameterized
  visits. No global canonical inheritance, no new noindex, no deleted public URLs.
- Invalid profession links redirect permanently only when an exact public
  template exists. Unrelated nonexistent profession paths still return 404.

## Search Console investigation

Read September 29; report header still says last updated September 20.
- 130 reported 404s include document slugs incorrectly linked under /profession/.
  Verified three exact matches in the new redirect test. This is not a claim all
  130 cases are resolved.
- 258 duplicates without selected canonical include /?ref=producthunt and many
  /create?template= URLs. Canonical fixes address those variants.
- 1,965 crawled-not-indexed examples include real public pages, editor variants,
  and generated opengraph-image URLs. That total is not 1,965 missing article pages.
  No mass redirects, removals, deindexing or artificial validation requests made.
- Inventory comparison: live 1,511; preview 1,511; zero missing or added URLs.
  Google indexing/rankings remain external decisions and require later monitoring.

## Measurement and partner status

- Added scripts/funnel-snapshot.sql, a read-only aggregate query, executed in the
  authenticated Supabase SQL Editor. Counts are distinct accounts/owners and
  receipt IDs, not pageviews. No customer writes or external analytics export.
- It is a lifetime current-record operational snapshot, includes staff/test users,
  excludes legacy Paid labels from verified receipts, and is not a visitor funnel.
- Auth admin listUsers(page size 500) returned HTTP 500 unexpected_failure,
  Database error finding users. Single-user listing worked. SQL aggregate worked.
  No auth records repaired or deleted. This requires a separate auth-data audit.
- Full consent-aware historical signup-to-revenue events, returning-user exclusion,
  source cohorts and refund/subscription lifecycle reconciliation remain unfinished.
  Do not mark that broader measurement checklist complete.
- Checked both partner threads: our September 29 replies remain the latest messages.
  Superpath discount and FCDC pilot activation await their responses/terms. No code,
  free entitlement, new email, advertising spend or pricing change made in this run.

## Verification

Production build and independent TypeScript check passed. Unit attribution tests
cover original metadata, repeat and concurrent callback updates, private paths and
source sanitization. Browser tests use mocked auth and writes, not new accounts.
Dashboard checked at 1440, 390 and 320px with screenshots, keyboard controls,
filters, pending draft recovery and no horizontal overflow. Guided creation and
email confirmation tests passed. Full-library search, pagination, reference-page
classification, dates, Clear/Undo and billing authorization tests passed.
Three targeted template pages tested at desktop/mobile widths; canonical URLs,
exact profession redirects and unrelated 404 behavior passed.

Preview: http://localhost:3037. Publication and live checks recorded below.
