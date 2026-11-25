# Native time-entry UI recovery checks

The mocked React Native screen test `scripts/test-mobile-save-ui.cjs` exercises the actual Workspace component and session-action/session-exit/load-gate helpers. It stubs authentication events, data loads, manual payload construction and saves. No network or customer mutations occur.

Passed 2026-11-25:
- Rapid double invocation of the confirm handler triggers one save.
- Failed save retains the exact reviewed payload for retry and locks edit fields.
- Uncertain-save sign-out warns about losing the in-memory retry ID.
- Home/Time navigation preserves the uncertain entry.
- Retry submits the same full payload.
- Confirmed save followed by failed refresh clears retry state, empties duration and reports saved-but-refresh-needed rather than another save.
- A save completing after an account switch does not show the old account's success message or retry state in the new account.

Limits: this does not prove backend idempotency, real device rendering, actual authenticated session restoration, process-death recovery or live Play acceptance. Retry state remains in memory only; existing app copy accurately says to keep the app open. No production behavior changed in this test-only commit.

Run from repository root with TypeScript resolvable (this native checkout uses NODE_PATH=mobile/node_modules), then `node scripts/test-mobile-save-ui.cjs`.
