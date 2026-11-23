# Seven-day trial and delivery checkpoint

Joshua authorized implementation on November 22, 2026. This supersedes the earlier proposal-only trial discussion, not the requirement to verify billing. Existing subscriptions and prices must remain unchanged.

## Candidate behavior (not live)
- Free remains available; Starter $9/month and Professional $29/month remain unchanged.
- Seven-day card-required trial for first-time Stripe customers with no subscription history, gated by `MFH_SEVEN_DAY_TRIAL_ENABLED=true`. Default is OFF.
- Pricing shows renewal amount, eligibility, cancellation path, and separate client processing fees. No fake scarcity or promised conversion gains.
- Existing subscription or incomplete billing blocks another checkout. Same-plan open checkout is reused; a different open plan is blocked. Customer creation and checkout use idempotency keys.
- Current provider subscription state, not stale event payload, determines access. Lifecycle updates match both customer and saved subscription. Trials receive access; canceled/unpaid subscriptions do not.
- No customer data is deleted when access ends. Trial end date appears in billing.

## Gates before enabling
- Stripe TEST-mode end-to-end checkout, trial end/test clock, successful renewal, payment failure, cancellation, replay and account mapping.
- Confirm webhook endpoint receives subscription updated/deleted as well as checkout completion events.
- Verify Stripe billing portal permits cancellation before renewal and the actual trial disclosure is rendered in Checkout.
- Account-wide Stripe idempotency key (independent of selected plan and time bucket) advances only after the previous checkout expires. Concurrent different-plan requests share the key; completed-but-unreconciled checkouts fail closed. Verify real provider concurrency and expiry behavior in TEST mode before activation.
- Audit entitlement boundaries and existing legacy subscriptions before deploying webhook access changes.
- Production build, mobile/desktop browser tests, risky-copy scan, SEO preservation and exact-commit deployment verification.
- No activation based solely on mocked tests. No live enrollment or charge during QA.

## Owner access steps
- Samsung: Settings > About phone > Software information > tap Build number 7 times. Settings > Developer options > USB debugging. Reconnect USB; accept this computer's debugging prompt. Windows sees Samsung USB, but ADB has no authorized device at this checkpoint.
- Email: https://vercel.com/dashboard > MicroFreelanceHub project > Settings > Environment Variables. Production: `EMAIL_OUTBOX_REPLY_TO=admin@microfreelancehub.com`. Must also deploy reply-routing code; setting alone is not a fix. Browser navigation timed out twice. No additional test email sent.
- Apple enrollment remains under review per Joshua. Mac/Xcode and iPhone access are required for native iOS testing. No store submission is claimed.
- Google Play Console access/enrollment status is still unverified: https://play.google.com/console/ . Do not purchase enrollment or upload the debug-signed preview as a production app.

## Score policy
The last evidence-based score stays 28/100. Local code does not earn deployed-workflow points. A 70-point milestone requires end-to-end client workflow, billing lifecycle, device-tested native delivery, working reply routing, and repeatable integration/recovery tests. 100 is a target, not a promise or certification.

## Verified this increment
- Separate TypeScript check and final production build exited successfully using the existing private local environment loader. Initial plain `npm run build` failed due to absent checkout environment; no secrets copied into this repository.
- Mocked checkout attribution/trial/history/concurrency-key tests; subscription lifecycle tests; agreement payment regressions; settings trial-date tests passed.
- Six pricing browser cases passed: 320/390/1440 widths with trial ON/OFF, signup plan handoff and no overflow. 390 and desktop screenshots visually reviewed. No authenticated checkout/provider interaction claimed.
- Public/live versus local SEO comparison passed: all 1520 URLs, pricing title/canonical/robots, robots.txt preserved. Risky-copy scan clean on changed pricing copy.
- Build log, screenshots and SEO receipt are private under `C:/Users/joshu/mfh-private-backups/product-completion-20261122/` (trial-paywall-final-build.log, trial-pricing-browser, trial-pricing-seo.json).
- Existing environment contains a live Stripe key, no separate test key. No provider enrollment/charge/test email performed. Vercel open timed out twice; publisher readiness timed out; no new publication request submitted.
- Android still absent from ADB despite Windows detecting Samsung USB. Native installation remains pending device authorization.
