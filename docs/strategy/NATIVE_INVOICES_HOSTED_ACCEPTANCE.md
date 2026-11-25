# Native invoices: hosted acceptance checkpoint

Date: 2026-11-25. Candidate source: `d9d8854`; invoice service SHA-256 `9cc6ee20a40f6a58b792dac447e4ea0b5e4dacec16d1dd4c7b62c8495792ddd1`.

## Result

**Hosted acceptance is incomplete. This is not a release approval.** No signed package, store upload, production mutation, schema change, customer-data write, email or payment operation was performed.

The known isolated staging project was established from prior acceptance receipts and staging-role JWT claims. Two new synthetic accounts were created for an initial run; both accounts and their exact-owner rows were subsequently removed and their absence verified. No existing user accounts were reused.

## Initial run and evidence

The initial runner exercised the real `mobile/src/invoiceData.ts` through Node and completed five groups:

1. Existing staging schema/target admission.
2. Synthetic authentication.
3. Owner-specific native client/project reference reads.
4. Reviewed USD draft creation with the exact total of 3,750 minor units.
5. Concurrent identical-operation replay returning the original invoice, with exactly one draft observed before the next test.

The changed-body reuse check did **not** establish the required `40001` response. The initial diagnostic did not retain its HTTP/SQLSTATE response, so it cannot distinguish a transport failure from a service response. Subsequent sequential cleanup stopped after operation-row absence could not be verified. A separate scoped recovery completed cleanup and found two draft rows before removing them.

That count is **not proof that the hosted RPC accepted changed-body reuse**: removing deduplication rows while a timed-out server request might still be executing can invalidate the test's teardown assumptions. No delayed SDK write retry was established. The root SDK used by this initial runner was 2.95.3, whereas the mobile dependency is 2.119.2; this run is not accepted as final native-client evidence.

Local, untracked evidence:

- `artifacts/native-invoice-hosted-receipt.json`: initial partial run and failed cleanup verification.
- `artifacts/native-invoice-cleanup-recovery.json`: exact synthetic owner cleanup; all 11 table counts zero and remaining auth user absent. The other auth user's complete cleanup is in the initial receipt.
- `artifacts/invoice-schema-source-comparison.json`: read-only hosted/source comparison.

## Read-only schema comparison

The hosted `workspace_invoice_mutate`, `workspace_invoice_validate` and `workspace_invoice_guard` function bodies on **both staging and production** match the checked-in invoice migration after removing only line-edge whitespace. No customer rows were read in production. The changed-body guard is present in both hosted definitions. No schema divergence or production defect was established by this investigation.

## Corrected runner

`scripts/test-mobile-invoices-hosted.cjs` now:

- Requires explicit `--staging`, private key input and a new evidence path; refuses other project-role credentials and refuses receipt overwrite.
- Resolves the actual mobile Supabase SDK and records both SDK and PostgREST versions.
- Verifies the existing staging name, reference and healthy status through the existing CLI before creating test users.
- Preserves request start/end/status, operation IDs/digests, returned invoice IDs and sanitized failure categories. No keys, passwords, tokens or full response bodies are printed or stored in receipts.
- Tracks complete native-service promises and transport completion; concurrent retry checks use `Promise.allSettled` before cleanup. Caller abort signals are preserved alongside the timeout.
- Does not equate local request completion/timeout with server quiescence.
- Atomically cleans up each exact marked synthetic owner: locks the owner counter, then the marked auth user, checks the exact synthetic identity, deletes only that owner's fixture rows and auth user in the same transaction. Existing requests must settle before the lock proceeds; later JWT requests fail the counter/auth foreign key after the user is deleted. Counts and auth absence are read back afterward. An uncertain cleanup submission is not blindly retried.
- Records planned synthetic account-creation emails before sending requests, so an uncertain create response is explicitly a cleanup blocker rather than silently forgotten.
- Requires actual database rejection codes for foreign relationships; a network error cannot pass those tests.

The corrected bounded rerun stopped during **read-only project admission**, before any new user or row was created. `api.supabase.com` returned Cloudflare `502 origin_bad_gateway` with `Retry-After: 60`. The runner did not bypass admission or continue into mutations. Its receipt is `artifacts/native-invoice-hosted-receipt-rerun.json`; the sanitized CLI error is `artifacts/invoice-project-admission.log`.

## Final bounded execution after admission recovery

One read-only health check at **22:28:31 UTC**, 201 seconds after the prior 502 (beyond its 60-second retry interval), verified the exact staging project as `ACTIVE_HEALTHY`. Evidence: `artifacts/invoice-project-admission-final-health.json`.

The subsequently authorized single corrected execution used **Supabase 2.119.2 / PostgREST 2.119.2** and completed the same first five groups. Initial USD create and both concurrent identical-operation RPCs returned HTTP 200 in 118-196 ms. The owner-scoped list still contained exactly one draft before the changed-body check.

The changed-body request then failed with a **25.011-second `TimeoutError`**, HTTP status `0`, no database error code and no returned invoice ID. The receipt records the same operation ID as the baseline and a different payload digest. This is a demonstrated transport failure; it does **not** establish acceptance or rejection by the hosted guard. The runner correctly failed rather than counting a generic network error as the required `40001` conflict.

**Atomic cleanup passed:** both exact marked synthetic accounts were removed in their scoped SQL transactions; all 22 subsequent table-count readbacks were zero and both auth-user lookups returned 404. Client transport and native-service outstanding counts were zero. The receipt reports `cleanupComplete: true`. No additional run was attempted.

Final evidence: `artifacts/native-invoice-hosted-receipt-final.json`. This preserves original failure receipts separately. The final run did **not reach** JPY/KWD saves, simulated lost-response recovery, other-account invoice reads, cross-account/relationship denials or anonymous/direct-write denial checks; those are not claimed as passed here.

## Resume requirements

1. Investigate the changed-body rejection response timeout before repeating mutations. The function bodies already match source; do not replace the guard or weaken expected database errors merely to make the test pass. Management admission recovered, but that alone did not prove RPC rejection delivery.
2. Once the response-path problem is understood and a bounded rerun is appropriate, use verified staging and a fresh receipt path; never print private credentials. Example shape: `node scripts/test-mobile-invoices-hosted.cjs --staging <private-key-file> <new-local-receipt>`.
3. Require all planned exact-total, replay/conflict, lost-response recovery, owner/RLS and unauthorized-write checks plus atomic cleanup/read-back. The corrected runner's hosted result is not yet a pass.
4. Preserve all original failed-run evidence; do not replace it with a later successful receipt.
5. Complete native device/layout/accessibility checks, privacy release work and separately versioned signing/distribution afterward. Node-hosted acceptance is not Android/iPhone acceptance; the released Android 0.1.9 remains unchanged.
