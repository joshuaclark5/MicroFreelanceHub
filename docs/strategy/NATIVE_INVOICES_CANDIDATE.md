# Native invoice candidate — 2026-11-25

Source-only candidate after the released Android 0.1.9/code 10 baseline. No package version, signed artifact, backend migration or store release changed in this slice. Not full invoice parity and not production-ready without the remaining gates below.

## Implemented

- Native Invoices tab and Home shortcut in both store-companion distributions and direct mode. At narrow widths navigation can wrap rather than clipping five tabs.
- Owner-scoped invoice list with exact-count UUID pagination, loaded-record search and all/draft/issued/void status filters. Incomplete-page labels remain visible; currencies are not aggregated.
- Saved document detail with exact minor-unit totals, date-only values and issued/void client snapshot names. No paid/unpaid inference from invoice-record status.
- Native reviewed draft creation: client and optional matching-project selection, seller, seven existing currencies, issue/due dates, up to 30 lines, whole quantities and normal decimal prices, optional memo.
- Shared website `documentInput`, `mutationInput` and money conversions. JPY/2-decimal currencies/KWD use integer minor units, not floating point multiplication. RPC remains the existing authenticated `workspace_invoice_mutate({p})`; no client-side authority or backend contract shortcut.
- Review performs no writes. Confirm locks the payload and operation UUID. Unknown responses retry the exact operation, using existing durable server deduplication; no new UUID is created until a new review. Receipt owner/document/version/status/amount are verified.
- In-memory drafts survive tab navigation and participate in App sign-out warnings. Actor-key remount clears state on auth change; async responses and discard dialogs carry actor/epoch fences. A verified actor mismatch from a service response, even without an auth event, hides all private UI and keeps an uncertain operation private until the original account is verified. Generic network errors clear list/detail records but preserve the draft with truthful copy.
- No unnecessary client email/phone/notes fetched by invoice reference selectors. Stored document text receives neutral display substitutions without rewriting source records.
- `EXPO_PUBLIC_DISTRIBUTION=appstore` now shares the store-companion no-workspace-purchase-link behavior with `play`. This is source readiness, not an Apple policy or review approval.

## Verification completed

- `npm --prefix mobile run typecheck`.
- `node scripts/test-mobile-invoices.cjs`: exact money/date/quantity/total validation, reviewed object freezing, durable retry fixture, invalid receipt, account fences, cursor/count/order checks, owner rows, minimal reference projection, issued/void snapshot shape and neutral stored text.
- `node scripts/test-mobile-invoices-ui.cjs`: actual TSX with mocked native controls; lazy reads, tab/draft preservation, no-write review, duplicate-click fencing, locked retry identity, success reset, refresh failure clearing, refresh/retry race, stale actor/dialog/receipt handling. Real service auth checks also exercise a different verified account without any auth event on refresh and submit; all private fields remain hidden until original-account verification. Each of the three concurrent read paths independently fences immediately on a verified mismatch even when both siblings hang; original-owner recovery does not await those abandoned requests, and late settlements cannot release a newer read lock.
- `node scripts/test-mobile-home.cjs` in direct, `--play`, and `--appstore` modes. Native invoice navigation and store link boundaries included.
- `node scripts/test-mobile-save-ui.cjs`: existing time workflow plus invoice-draft sign-out warning and stale-confirmation rejection. Fixed its pre-existing outdated Refresh button lookup to the actual `Refresh projects & time` label.
- Risky-copy scan of native screen and App: no prohibited marketing claims.

These are local fixture/source checks, not an authenticated phone or hosted invoice write claim. No customer records, emails, payment operations or remote database mutations were used.

## Remaining gates and parity

1. Independent source review and iOS/Android JavaScript exports passed. Signed store build/device checks are separate gates.
2. Hosted acceptance remains incomplete: actual mobile-SDK staging reads, exact USD save and identical-operation recovery passed, but changed-body rejection delivery timed out. All synthetic records/accounts were removed and absence verified. See `NATIVE_INVOICES_HOSTED_ACCEPTANCE.md`; later currency, isolation and unauthorized-write groups were not reached. Staging/production function bodies match source, but this does not substitute for completed hosted acceptance.
3. Android/iPhone layout, keyboard, long lists, screen-reader checks and signed-in device acceptance; list ordering is UUID pagination, not a chronological sorting promise.
4. Android/iOS invoice source inventory completed and independently reviewed in `NATIVE_INVOICES_PRIVACY_REVIEW.md` and the Android inventory addendum. Public policy, final-artifact behavior and applicable store declarations still need reconciliation before release; the proposed policy copy is not published.
5. Signed replacement build/version, tester deployment and exact release receipt. Existing 0.1.9 remains published until a separately verified release.
6. Native draft editing/deletion, reviewed issue/void, audit/history, recurring templates, allowance records, downloads and separately implemented payment integrations remain absent. Invoice records themselves do not send messages, collect money or calculate tax/discounts.
7. Draft/retry identity remains memory-only; app termination/sign-out loses it. UI warns users to check saved invoices before creating another after an unconfirmed operation.

## Independent review completion

All original findings were fixed and rereviewed: typed account-change fence, immediate per-read fencing even while other queries never settle, read/retry serialization, old-request lock suppression and immutable issued-client list/search identity. Independent reviewer regressions and parent service/UI reruns pass. Evidence: `artifacts/native-invoice-review.md` and `artifacts/native-invoice-review-regression.cjs`. No hosted/device/store-release claim follows from these local checks.

## Combined export checks

Both `node scripts/export-ios-readiness.cjs` (App Store companion mode) and `node scripts/export-mobile-parity.cjs` (Play companion mode) passed, each using one Metro worker serially. Outputs are Hermes JavaScript/assets, not signed IPA/APK/AAB releases. iOS source-hash receipt is saved locally; Android log is `artifacts/invoice-android-export.log`. These exports do not change or overwrite the preserved signed 0.1.9 artifacts.
