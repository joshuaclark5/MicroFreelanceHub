# Provider-history reconciliation (operator-only, read-only)

This supplements the internal cohort export; it does not modify accounts, subscriptions, profile customer links, invoice ledgers or ad tracking. Keep provider snapshots and owner maps outside Git. Only aggregate outputs are suitable for private operator review; do not publish business financial findings automatically.

```
node scripts/ad-provider-history-report.cjs START_UTC END_UTC PRIVATE_INVENTORY_JSON PRIVATE_MAPPING_JSON PRIVATE_EXCLUSIONS_JSON NEW_REPORT_JSON
```

The end cannot be in the future or after the completed provider scan. Inputs come from authorized READ-ONLY Stripe LIVE platform invoice/refund pagination and current MFH profile mapping. Provider scans must record completeness and createdBefore; interrupted/truncated scans are not complete history. Use the existing secure credential, never a key in command arguments or output. No Connect customer-job data is combined with platform subscription revenue.

Inventory: normalized paid invoices with provider ID, customer/subscription, charge/payment-intent references, amount/currency, paid status/time, billing reason, out-of-band marker and livemode; refunds include ID, payment reference, amount/currency, status/time and livemode. Mapping: current profile ID/customer/subscription, bounded cohort source or null, synthetic boolean; provider subscription ID/customer, plan/owner metadata, fixture marker and purpose. Normalize identities in memory or private files only. Exclusions are the same private UUID registry as the cohort exporter.

The reconciler requires one unambiguous current customer owner and recognized subscription plan (or the already linked legacy subscription). Mismatched/missing ownership stays unresolved: never assign a payment based on a similar name/email or rewrite a customer's subscription to make a report pass. TEST mode, conflicting duplicate objects and malformed financial values cannot count as LIVE paid outcomes. Synthetic/staff records are excluded. Currency totals stay separate.

Invoice IDs and refund IDs dedupe independently. A renewal uses the provider subscription_cycle reason, not simply the second invoice. A successful refund within the observation window may link to an older invoice; unmatched refunds are unresolved, not presumed customer-job payments or subtracted from an unrelated subscription. Non-subscription invoices do not enter subscription revenue. Pending/failed refunds do not count as successful. Paid-out-of-band invoices do not establish provider cash collection and remain unresolved.

Invoice inventory counts cover all scanned history; unresolvedInvoicesInWindow and row outcomes refer to the half-open observation window. Successful-refund outcome counts refer to that window. First provider-observed payment is not a first-ever purchase across other platforms/accounts. Acquisition channel, first-ever paid accounts, net revenue and CAC remain Unknown until justified by complete classification/cost/acquisition evidence. Output is always PROVISIONAL, even when the optional staff registry is marked reviewed.

Verification: `node scripts/test-ad-provider-history-report.cjs` checks actual reconciliation with synthetic fixtures: duplicates, ambiguity, flags/staff exclusions, subscription-cycle renewal, half-open boundaries, currency separation, prior-invoice refunds, job-payment exclusion, TEST rejection and no identity leakage. `node scripts/test-ad-cohort-report.cjs` executes actual export SQL and covers every currently used synthetic flag: synthetic, is_test, test_account, synthetic_test and mfh_synthetic.

No website source changed in this operator packet, so no website build or deployment is claimed. Preserve prior reports; each run requires a new output file/directory. A report is not a Meta diagnostic, actual customer-retention result or spending approval.
