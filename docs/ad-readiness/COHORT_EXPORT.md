# Read-only launch cohort export

Run from a trusted operator environment with existing Supabase CLI access:

```
node scripts/ad-cohort-report.cjs START_UTC END_UTC NEW_OUTPUT_DIRECTORY PRIVATE_EXCLUSIONS_JSON
```

Timestamps use canonical UTC, for example `2026-11-28T00:00:00.000Z`. Windows are half-open `[start,end)` and may not end in the future. Existing output directories are never overwritten. The private exclusion file contains `excludedOwnerIds` (UUID array) and `reviewed` (boolean). Keep fixture/staff identities outside Git. The script defaults to the existing production project and uses read-only SQL; it does not alter accounts, billing, tracking or provider settings.

## What is measured

- Confirmed new accounts: created in the window and email confirmed before its end. Not the timestamp of a signup-completion event.
- Saved agreement accounts: distinct accounts with a saved record created in the window, not useful activation, sharing, second use or retention.
- Paying accounts/invoices/gross USD cents: authoritative internal MFH subscription-invoice ledger, positive paid amounts only. Invoice IDs are unique in that ledger. Multiple documents cannot multiply revenue.
- First **observed** paid account: earliest positive invoice currently present in that ledger. Its recent rollout means this is not proof of a first-ever purchase.
- Currently canceled accounts: current recorded state, not cancellations occurring in the window.
- Non-USD invoices are counted separately and never added to USD revenue.

Client job-payment tables are not queried and cannot enter MFH revenue. Test fixtures flagged in metadata, invalid fixture email domains and explicit private exclusions are omitted. A complete staff/fixture registry is still required before commercial totals are trusted. The output retains a PROVISIONAL label even when the registry is marked reviewed because provider history/refunds have not been reconciled.

Only allowlisted `mfh_launch_v1:<cohort>:<variant>` attribution becomes a cohort label; all other values become Unknown. Channel remains Unknown because the source token alone does not prove paid acquisition. No raw source, contact, account ID, document body, signing token or payment details are exported. JSON/CSV contain aggregate counts only; small aggregates are for private operator review, not public publication.

## Intentionally Unknown

Spend, visits, first useful action, shares, signatures, first-ever paid accounts, refunds, net revenue, renewals, second use, window cancellations and both CAC measures remain Unknown. Current cancellation state and a second invoice are not silently relabeled as cancellation events or renewals. This report is not profitability validation or a complete AD-09 acceptance.

## Verification

`node scripts/test-ad-cohort-report.cjs` executes the actual query in isolated PGlite. It verifies exclusion handling, distinct account counts, no join multiplication, currency separation, half-open windows, unknown attribution, no identities in output and malformed-input rejection. It uses the existing local PGlite installation; no new dependency or service is purchased.

The production read-only run ending `2026-11-28T09:28:26.000Z` is saved in the canonical checklist's `docs/ad-readiness/cohort-production-20261128T092826`. It found no eligible paid invoices in that window, not zero lifetime revenue. The earlier draft run with a future end boundary is superseded and not acceptance evidence. No application source changed, so this operator-tool packet does not require a website deployment.


## Synthetic flag correction and provider-history supplement
The exporter now excludes synthetic_test and mfh_synthetic as well as synthetic/is_test/test_account and the private explicit registry. Actual SQL tests exercise each flag, not just one example. This closes a concrete exclusion gap found during the launch audit. Previous evidence remains preserved; use a fresh output for new observations.
See PROVIDER_HISTORY_RECONCILIATION.md for the read-only supplementary provider-history report. It does not silently overwrite the internal ledger, infer a first-ever purchase or relink accounts. Neither report establishes Meta attribution or profitability.
