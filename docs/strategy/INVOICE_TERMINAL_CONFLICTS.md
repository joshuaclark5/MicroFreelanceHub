# Invoice terminal-conflict candidate

Date: 2026-11-25. **Source/local-test candidate only; hosted application and release are not established by this document.**

## Problem and scope

A controlled native staging check sent one changed-payload request using an already-saved operation ID. The client timed out after 25 seconds. Read-only server evidence recorded repeated `Operation reused with different request` errors with SQLSTATE `40001` during that request. The existing guard rejected the request; this was not evidence of a duplicate being accepted by that guard. The repeated transactions came from PostgREST's Hasql transaction retry path: [PostgREST v14.18 MainTx](https://github.com/PostgREST/postgrest/blob/v14.18/src/PostgREST/MainTx.hs#L99) uses [Hasql transaction sessions](https://github.com/nikita-volkov/hasql-transaction/blob/1.1.1/library/Hasql/Transaction/Private/Sessions.hs#L14), which retry `40001` and `40P01`. The scoped logs showed one backend running distinct transactions for that single client request.

`40001` is PostgreSQL's serialization-failure code. Six deliberate business-conflict branches in `workspace_invoice_mutate(jsonb)` are terminal for the submitted payload, rather than retryable serialization failures:

- Changed account identity.
- Reuse of an operation ID with different contents.
- Stale invoice version.
- A draft-only operation against an issued/void invoice.
- Changed reviewed total.
- Stale recurring-schedule version.

The additive migration `20261125230000_invoice_terminal_conflicts.sql` changes only those six explicit codes to `P0001`. It does not change true engine-generated serialization errors, validation, ownership, locking, deduplication, stored rows, RLS or grants.

## Migration safeguards

The migration checks the exact function signature, language, security-definer flag and search path. It compares the known original body using builtin `md5` after CRLF and line-edge indentation normalization, and requires exactly six matching code literals. No extension is needed. Unexpected identity, body or security configuration fails before replacement.

It uses the current `pg_get_functiondef` output for `CREATE OR REPLACE`, replacing only the six code literals. This preserves hosted header formatting and attributes rather than replacing them with an assumed local definition. Postconditions require the exact expected definition and unchanged OID, owner, ACL, language/signature, security, search path, volatility, strictness and parallel setting. All steps run in one transaction.

Re-executing an already-applied migration fails its old-body guard. After an uncertain hosted response, inspect definition and migration history rather than blindly reapplying it.

## Compatibility

The existing website API already maps `P0001` to HTTP 409 with a generic non-sensitive conflict message. Its behavior is unchanged. A direct PostgREST caller may receive HTTP 400 with code `P0001`; native code already treats RPC errors as unconfirmed saves and retains the reviewed retry operation. Hosted tests must check the actual nonretryable code and response time, not incorrectly require direct HTTP 409.

No mobile package/version, public copy, route implementation or provider configuration changes in this candidate. Android 0.1.9 remains the released internal-test version.

## Local verification

- `node scripts/test-workspace-invoices-db.cjs`: **18 groups passed**, including actual additive migration execution, all six `P0001` conflict branches, same-operation recovery, exact totals, issue/CAS races, immutable snapshots, recurrence, allowance bounds and denied direct/cross-account writes.
- Migration proof captures the original function definition, rejects body/security drift and repeated application, accepts staging-like indentation/CRLF, performs forward/rollback/forward, and compares data fingerprints, table policies/grants, other functions and target-function identity/attributes. A rollback rehearsal inside a transaction is also rolled back. No hosted baseline is claimed by these local fictional fixtures.
- `node scripts/test-workspace-invoices-api.cjs`: **10 groups passed**, including both `P0001` and genuine `40001` mapping to 409 without leaking private database messages.
- `npm run build`: **passed**, using `CIRCLE_NODE_TOTAL=2` for one Next.js worker and a 2 GiB Node heap limit. The existing project configuration skips build-time TypeScript/lint validation; no independent TypeScript/lint pass is claimed. No application TypeScript or rendered copy changed in this candidate.

Evidence is local under `artifacts/invoice-conflict/`: `db-proof.json`, `api-proof.json`, `invoice-conflict-migration-proof.json`, captured `invoice-conflict-before.sql` and `build.log`. Local PGlite serializes submitted concurrent statements; hosted PostgreSQL contention/HTTP response timing remains a separate gate.

## Hosted release and rollback requirements

The parent owns verified staging backup/restore, migration-history review, hosted conflict-response and cleanup tests, then separately reviewed production application. This worker made no hosted database calls or changes.

Before applying, privately capture the **actual target's** `pg_get_functiondef`, owner/ACL/security attributes and affected data/history fingerprints. Rehearse restore and the intended migration on an isolated copy. For rollback, restore that exact captured definition in a transaction and verify the recorded attributes and data fingerprints. Do not globally replace every `P0001` with `40001`: other validation errors intentionally already use nonretryable errors. The local captured definition is test evidence, not a production rollback artifact.

After a controlled hosted check, require a prompt `P0001` response for changed payload and all other terminal conflicts, unchanged identical-operation recovery and explicit account-isolation/cleanup results. No full native feature parity or new store availability follows from this migration.
