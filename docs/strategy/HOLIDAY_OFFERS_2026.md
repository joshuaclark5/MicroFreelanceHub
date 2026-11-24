# 2026 holiday offers and Twilio setup

Joshua requested Black Friday and Christmas promotions modeled on HoneyBook and authorized setup in his signed-in Twilio account, retaining the approved $20/month total spending ceiling.

## Offers

HoneyBook source reviewed November 23, 2026: https://www.honeybook.com/lp/policy/bfcm-2026. Their terms specify 50% off the first annual year, plus a separate 15% three-month offer. We implement the first-annual-year pattern only, in our own copy and branding; no new three-month billing plan or feature-equivalence claim.

- Black Friday: November 23–December 7, 2026, Eastern time.
- Christmas: December 15–26, 2026, Eastern time.
- 50% off the first annual invoice only for first-time paid subscribers.
- First year: Starter $144, Professional $264, Agency $624. Normal renewals: $288/$528/$1,248 annually.
- Monthly pricing, existing subscriptions and client payment-processing fees remain unchanged.
- No stacking. Prior subscription history disqualifies the holiday offer; a customer must explicitly review regular pricing to continue without it.
- Checkout must begin within the campaign window and complete within 60 minutes. Stripe checkout expiration and coupon redemption cutoff enforce the grace period.
- Campaigns do not auto-repeat in future years. Server time determines validity; stale client requests are rejected.

## Implementation and verification boundary

Public offer endpoint is no-store. Homepage/pricing banner and checkout review share the campaign definition. Browser refreshes offer data every minute; server revalidates dates, cadence and subscription history before applying a coupon. A fixed Stripe coupon per campaign has percent_off=50, duration=once, campaign metadata, and redeem_by matching the campaign end plus checkout grace. Existing coupon configuration must match exactly or checkout fails rather than silently changing price.

Both live Stripe coupons were created and retrieved successfully during setup; no checkout sessions, subscriptions or charges were created for this verification. Receipt is private local evidence at C:/Users/joshu/holiday-coupon-receipt.json.

## Twilio

The signed-in Twilio tab was verified. Standard browser automation was blocked by unresponsive unrelated page targets. A bounded, direct CDP connection to the Twilio page recovered DOM inspection without reading cookies, hidden authentication state or credentials. Initial Messaging/With code onboarding stalled; skipping the optional questionnaire and selecting Limited trial completed onboarding.

Observed account status: Trial, 30 days remaining, 100 free SMS units. No credit card, top-up, paid number, text or call was submitted. Trial is limited to verified testers and is not production messaging. The $20 approval is a budget ceiling, not an enforced provider spending control; production sender verification, provider fees, consent/outbox/suppression integration and a hard application budget guard remain prerequisites.

Messaging Services explicitly requires an upgraded account. Upgrade step 1 requires legal business name and tax address; left open for Joshua to enter directly. Balance/payment steps have not been submitted. No provider spend occurred.

Verification: production build and TypeScript passed; campaign/coupon and checkout tests passed; holiday and regular-price browser suites passed at 320, 390, 768 and 1440 pixels, including accessibility and no live checkout posts.
