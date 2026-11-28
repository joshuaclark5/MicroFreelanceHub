# Billing portal and support consistency

AD06/AD08 scoped packet; full launch remains blocked on separate provider/commercial gates.

- Existing live provider portal configuration supports period-end cancellation, payment-method updates and invoice history. Reused read-only evidence; no LIVE configuration/customer/subscription changes.
- Actual Stripe TEST hosted portal: $31/month synthetic subscription, test Visa, paid invoice history,320/390/1440 layout, cancellation review with actual December28 end date; single cancellation submission produces active + cancel_at_period_end at provider. Existing lifecycle cancellation/retry/renewal proof reused.
- Actual app HTTP portal handoff with normal provider-authenticated synthetic stage owner: server selects its own linked TEST customer and ignores caller customer. Hosted TEST history opens at390px. Temporary staging customer mapping restored EXACTLY (all profile fields unchanged afterward).
- Test cleanup: subscription canceled, product archived. Provider rejected deactivation of TEST default portal configuration; readback confirms active/default. Preserve it and synthetic customer/history, do not retry or create a replacement just to remove it. No live charges or live changes. Opening payment-method edit form remains unverified; availability/configuration is not a completed card-change test.
- Fixed concrete error: failed profile lookup no longer tells a subscriber to upgrade. Distinct503 unavailable/404 absent account/502 provider error; support guidance preserves subscription and discourages duplicate purchase. Origin guard, verified actor selection and no-store response; private provider errors no longer logged.
- Privacy Challenge section now uses the same actual admin support address as other support/deletion routes. No retention/refund/deletion rights or commercial terms changed.
- Actual handler tests pass auth/origin denial, lookup distinction, owned customer selection and sanitized errors. Local production-build browser checks pass private billing boundaries and all privacy email links at320/390/1440. Build58846 exit0; independent types36673 exit0. Existing QA unauthorized portal probe now supplies the website Origin as browsers do.

Production publication and exact live verification pending. Rollback: revert bounded app commit; no database migration or live provider mutation in this packet. Original Module1 remains12/31 and M01-027Partial. Ads unpublished/spending disabled.
