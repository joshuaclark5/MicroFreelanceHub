# Android Play policy follow-up — 2026-11-25

Status: review in progress, not a compliance declaration or Play approval.

## Account requests
The 0.1.5 local candidate exposes privacy and an explicit deletion-request email action while signed in, signed out and during restore failure. It opens a draft only; failed handlers show an adjacent fallback address and do not report successful submission. This does not automate deletion, cancel billing or prove request fulfillment.

The existing website privacy policy describes ownership verification, retention and the temporary self-service deletion hold. Google's deletion FAQ permits an appropriate support-email/form request pathway; automated deletion is not the only option. A prominent public web request resource and operational fulfillment still need acceptance. No deletion test has been run on a customer account.

DNS currently reports the domain MX at webhost.dynadot.com. MX is NOT proof that support@microfreelancehub.com receives/forwards requests. Prior mailbox delivery evidence has not been verified in this review. No test email was sent.

## Payments distinction
Official Payments policy fetched 2026-11-25:
https://support.google.com/googleplay/android-developer/answer/9858738?hl=en

- Payment for MFH digital SaaS features/subscriptions falls within the general Play Billing rule unless an applicable exception/program applies.
- App buttons, links and signup flows leading to alternative payment methods require review; the existing browser shortcuts are not automatically exempt just because they open an external browser.
- Customer payments for physical services (for example hair appointments) are a different category; the policy says Play Billing must not be used for physical-service payments. Do not replace all business invoice payments with Play Billing.
- Enrollment in regional external-payment/alternative-billing programs has not been verified. Do not assume eligibility or accept declarations based on it.

Current native surface: Google signup/login, external website signup/recovery, project/workspace/calendar/booking/invoice links. No native buy/upgrade button or native subscription purchase exists. Review actual downstream website flows and account entitlements before declaring compliance. Do not remove customer invoice workflows indiscriminately.

## Still required
Authenticated-device acceptance, return-session/sign-out tests, public privacy/request path and mailbox handling verification, store listing/data disclosures, reviewer access, track setup and account-specific production-access requirements. The direct APK prerelease does not start a Play closed-testing period.

