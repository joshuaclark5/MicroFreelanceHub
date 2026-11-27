# Android subscription-link audit — 2026-11-24 America/New_York

## Verified distribution

GitHub API via `gh release view` confirms android-v0.1.6-test.1 is non-draft, prerelease, with both APK and AAB uploaded. Local SHA-256 hashes match the API asset digests:

- APK: cb924c3234532a0f39e542efc1d4d2e2d1c4646d704c2e878aaaa9ce90b2da6b
- AAB: d5ea77640a5be3af28784844d03ec8e732b6c93e63a181c8b193f80ffa6e0626

This verifies publication/asset identity, not Google Play approval or authenticated-device acceptance.

## Concrete downstream subscription path

Source in this Android release checkout establishes:

1. `mobile/App.tsx:137`: Agreements (website) opens `/dashboard`.
2. `app/dashboard/page.tsx:377`: non-Pro accounts see Upgrade to Pro.
3. `app/dashboard/page.tsx:679`: this opens PricingModal.
4. `app/components/PricingModal.tsx:23`: upgrade navigates to `/checkout-plan` with a paid plan.

Additional entry points needing coverage: external signup/recovery both open `/login`; signed-out setup links to `/pricing`; native workspace/project shortcuts expose the wider website navigation. Removing only the Agreements shortcut would not establish that all downstream purchase paths are removed.

This is a source-backed path audit, not a newly completed authenticated browser journey. Public `/login`, `/pricing`, and `/privacy-policy` returned HTTP 200 today; text extraction does not execute client interactions and cannot prove purchase-path isolation.

## Policy evidence and implementation direction

Google Payments policy fetched today: https://support.google.com/googleplay/android-developer/answer/9858738?hl=en

It explicitly includes business productivity SaaS, app links/buttons and signup flows leading to non-Play payment methods, with exceptions/programs. Enrollment in such a program remains unverified. No policy declaration was accepted in this turn.

Next implementation should evaluate a Play companion experience with native sign-in/recovery and bounded functionality without subscription purchase prompts, or a properly supported billing/program integration. A query flag hiding a single banner is insufficient: browser navigation, signup, account upgrades, support/privacy navigation and account limits need end-to-end review. Preserve the existing direct-test APK and ordinary website checkout; do not disable customer invoice payments indiscriminately.

Still open: monitored deletion-request destination (owner answer pending), native/web disclosure alignment and fulfillment, authenticated device tests, store data disclosures/reviewer access and account-specific testing requirements. No code or store changes made in this audit. Overall improvement goal remains active; authenticated HoneyBook visual audit and payment/signature acceptance remain unfinished.
