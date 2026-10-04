# Direction 04 implementation — 2026-10-04

Base: e082b3ee5e1d225c76e098ef5e052b3e3e76a604.
Authorized full implementation, replacing the previously partial refresh.

## Screen acceptance
Approved desktop and mobile images in mfh-design-vision-v4/images were compared with actual 1440/390/320 captures. Twelve comparison sheets cover home, dashboard, first-account, guided editor, payment, SEO/template, portal, settings, change order, client approval, recovery states and pricing.
- Workspace sidebar, compact dashboard rows, real Draft/Signed/Paid filters, exact recorded totals, search, selected detail and original row actions.
- Project / Scope / Payment / Review workflow with tab recovery, document preview, mobile preview dialog and complete handoff to existing direct editing.
- Payment setup distinguished from software subscription, with real loading/error/retry states.
- Separate change order is a NEW ordinary agreement through existing draft/create/save handlers, preserving original. Scope, additional fee, timeline and original UUID are included. Client approval/signatures/payment belong to the new agreement.
- Deliberate implementation detail: original relationship is an explicit document-text reference, not a new immutable version-history database model. Existing in-place revision remains explicitly available with signature-reset warning.
- Document-first client presentation, signing focus containment, pending payment verification retry and unavailable recovery.
- Homepage, templates and pricing aligned, full MicroFreelanceHub wordmark and white-M/slate brand preserved.

## Preservation and meaningful differences
Real application state replaces illustrative mock counts/statuses. No invented sent/viewed states or entitlements. Existing direct editor retains detailed terms, taxes and installment controls. Long public content remains even where concept images were shorter.
No API/action/SQL changes; auth, payment verification and saving handlers retained. No real customer edits, charges, outreach, price changes or spending.

## Verification evidence
Local evidence (not committed binaries): qa-d4-baseline, qa-d4-complete and comparisons; d4-seo-baseline.json and d4-content-baseline.json.
Build and independent TypeScript pass. Run type checking AFTER build; concurrent regeneration of .next/types can produce transient TS6053.
Regression coverage: guided draft reload/deposit handoff/clear+undo; dashboard search/filter/actions/recovery; separate change order preserving original at all three widths; legacy revision confirmation; signing focus; client payment/pending/no-payment; auth/checkout attribution; billing/template errors; isolated SQL/PGlite ledger; conversion/canonicals/template handoff; editor accessibility/contrast.
Final screenshot harness checks 24 screens/states at three widths (72), horizontal overflow, runtime errors and automated WCAG A/AA. Private screens and writes use intercepted fixtures, not customer records.
Content comparison preserves all 331 baseline paragraphs, sampled headings/links across eight public routes, metadata/canonical/robots and all 1,511 sitemap URLs. Sitemap parity is not a guarantee of indexing.
Deployment commit, final live evidence and rollback are recorded in C:/Users/joshu/mfh-strategy-365/DIRECTION04_COMPLETION_2026-10-04.md.
