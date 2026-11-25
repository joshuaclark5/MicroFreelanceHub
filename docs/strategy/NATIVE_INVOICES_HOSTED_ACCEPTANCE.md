# Native invoices: hosted acceptance checkpoint

Date: 2026-11-25. Candidate source: `d9d8854`; invoice service SHA-256 `9cc6ee20a40f6a58b792dac447e4ea0b5e4dacec16d1dd4c7b62c8495792ddd1`.

## Result

**Hosted staging acceptance passed, and the reviewed terminal-conflict correction is now independently verified in production. This is not a device/store release approval.** No signed package, store upload, customer-data mutation, email or payment operation was performed. Each target received only the exact reviewed function correction plus its atomic migration-history record, after fresh verified recovery rehearsals.

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

## Pre-fix bounded execution after admission recovery

One read-only health check at **22:28:31 UTC**, 201 seconds after the prior 502 (beyond its 60-second retry interval), verified the exact staging project as `ACTIVE_HEALTHY`. Evidence: `artifacts/invoice-project-admission-final-health.json`.

The subsequently authorized single corrected execution used **Supabase 2.119.2 / PostgREST 2.119.2** and completed the same first five groups. Initial USD create and both concurrent identical-operation RPCs returned HTTP 200 in 118-196 ms. The owner-scoped list still contained exactly one draft before the changed-body check.

The changed-body request then failed with a **25.011-second `TimeoutError`**, HTTP status `0`, no database error code and no returned invoice ID. The receipt records the same operation ID as the baseline and a different payload digest. This is a demonstrated transport failure; it does **not** establish acceptance or rejection by the hosted guard. The runner correctly failed rather than counting a generic network error as the required `40001` conflict.

**Atomic cleanup passed:** both exact marked synthetic accounts were removed in their scoped SQL transactions; all 22 subsequent table-count readbacks were zero and both auth-user lookups returned 404. Client transport and native-service outstanding counts were zero. The receipt reports `cleanupComplete: true`. No additional run was attempted.

Final evidence: `artifacts/native-invoice-hosted-receipt-final.json`. This preserves original failure receipts separately. The final run did **not reach** JPY/KWD saves, simulated lost-response recovery, other-account invoice reads, cross-account/relationship denials or anonymous/direct-write denial checks; those are not claimed as passed here.

## Accepted staging outcome after the reviewed correction

Read-only staging logs established repeated `40001` rejections from the same PostgREST database session. Official PostgREST/Hasql sources identify `40001` as a retryable transaction error. Permanent application conflicts were therefore requesting server-side retries; the guard itself remained effective. The reviewed additive migration changes only the six explicit permanent conflict codes to `P0001`, preserving all guards, function identity, owner, ACL, security configuration and RLS. Existing website handling already maps `P0001` to HTTP 409; direct native RPC receives terminal HTTP 400.

Before staging application, fresh private recovery sets for **both staging and production** were restored to isolated local databases. All 98 exported-table fingerprints, complete migration histories and function identities matched; exact candidate/history apply and rollback rehearsals passed. Containers had no network or published ports and were stopped afterward. This recovery proof is not a claim of production application.

The exact staging batch was submitted once and independently verified at **22:54:50 UTC**: only six error codes changed, the original migration source was recorded in the same transaction, all 98 legacy table fingerprints remained unchanged, and function attributes/RLS matched. Evidence: `artifacts/invoice-conflict-recovery/STAGING_APPLY_RECEIPT.json`. Migration SHA-256: `73024c8b2aec9a7fbd69f0d2cf2290cd122db78d72879a976d7f060c9eeed6bf`.

The revised runner then passed **12 of 12 groups** at **22:55:49 UTC** using the actual mobile SDK 2.119.2:

- Native reference/list reads, reviewed USD creation, and exact JPY/KWD minor-unit totals.
- Concurrent same-operation recovery and simulated lost-response recovery after a real hosted commit, without duplicate drafts.
- Cross-owner invoice reads and guessed IDs, actor-change fences, relationship rejection, anonymous RPC denial and authenticated direct-write denial.
- All six permanent rejection branches returned `P0001` / HTTP 400 promptly, with every owner-scoped invoice table unchanged before/after each rejection:

| Branch | Response time |
| --- | ---: |
| Changed operation payload | 168 ms |
| Actor mismatch | 150 ms |
| Stale invoice version | 140 ms |
| Reviewed-total mismatch | 140 ms |
| Non-draft mutation | 142 ms |
| Stale schedule version | 131 ms |

The changed-payload test retained exactly one original draft. Controlled synthetic raw-RPC issue/schedule fixtures also verified immutable issued snapshots and repeated-operation identity; these tests do not add native issue/schedule UI features.

**Final cleanup passed:** all 22 scoped table-count checks were zero, both synthetic accounts returned auth 404, and no native-service or transport requests remained outstanding. Evidence: `artifacts/native-invoice-hosted-after-conflict-fix.json`. Original failed-run and recovery receipts remain intact.

## Remaining release requirements

1. Native device/layout/accessibility acceptance, privacy release work and a separately versioned signed replacement build. Node-hosted acceptance is not Android/iPhone acceptance; Android 0.1.9 remains unchanged.
2. Signed Apple build, login/deletion readiness and actual iPhone/TestFlight checks remain separate gates.

## Production correction verified

The reviewed migration from [PR 46](https://github.com/joshuaclark5/MicroFreelanceHub/pull/46), source `88f4fb24306b7a3d68a11a0bd91b9181b8c2b07d`, merged as `e0793e9be3cda78c8591105726dd841377dad33c`, was submitted **once** to production at **22:59:37 UTC**. Source SHA-256 remained `73024c8b2aec9a7fbd69f0d2cf2290cd122db78d72879a976d7f060c9eeed6bf`; combined atomic function/history batch SHA-256 remained `1ddcb91242cdd95bb8a3ec879f7984a04c17a755041a7e8854832879e743ab92`.

Fresh preflight verified the production target, absent candidate history, exact baseline function and permissions, all recovery-file hashes, and unchanged baseline fingerprints. The command succeeded. Function/history readback succeeded immediately; a management project-list HTTP 502 interrupted subsequent read-only verification. After the provider's 60-second retry interval, read-only checks completed at **23:01:15 UTC**. The migration was neither resubmitted nor rolled back.

Verified results:

- Exactly six explicit terminal conflict codes changed; all other function definition text, identity, owner, ACL, security/search-path settings and RLS remained unchanged.
- Exactly one history record contains the original migration source; total history rows increased from 29 to 30.
- All **98 legacy table fingerprints** matched before/after, excluding only the new migration-history record. No concurrency difference required a waiver.
- No production synthetic users, invoice mutations, email or payment operations were used for verification. Hosted behavioral tests remain staging-only evidence.

Receipt: `artifacts/invoice-conflict-recovery/PRODUCTION_APPLY_RECEIPT.json`. Parent separately verified the exact merged commit's deployment success and public invoice-route health; public HTTP health is not a production invoice-write test. The native invoice source still needs its separate signed replacement release.
