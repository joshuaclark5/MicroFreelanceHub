# M01-011 mobile workspace navigation

## Scope and evidence

- Existing verified behavior preserved: collapsible menu, links, current-page indicator, desktop navigation.
- Reproduced production gap: no visible Close and destination navigation left focus on BODY (authenticated 390px check; private artifact m01-011-audit.json).
- Added visible Close, Escape focus return, and root-layout navigation handoff surviving route-local unmounts. Agreements explicitly targets its existing title. Open modal dialogs retain focus; rejected focus attempts do not count as success.
- Local production build and standalone TypeScript passed after corrections. Reusable regression: scripts/test-workspace-navigation-browser.cjs. Sixteen check groups passed at 360, 390 and 1440px, including delayed heading, Back cancellation, temporary tabindex removal and real onboarding-dialog containment.
- Tests use loopback-only synthetic auth/API fixtures with external browser traffic blocked. They do not prove hosted authentication, roles or tenant isolation. No auth, API, data-model or provider changes in this slice.
- Latest local receipt: artifacts/m01-review-receipt.json, 2026-11-26T04:58:09.575Z; artifacts remain local, not included in source publication.

## Release gate

Independent re-review and exact-version live verification pending. No published claim yet. Generic preview server/provider isolation remains unverified; no hosted mutation or provider test is authorized by a preview URL alone.

## Recovery

Pre-change production: e0793e9be3cda78c8591105726dd841377dad33c. This is a UI-only change with no migration or stored-data mutation. Recovery is a scoped revert of this application change through the existing main/production deployment process, preserving unrelated later commits. Verify provider success and the public domain after any recovery; do not reset branches or restore customer databases for a UI rollback.
