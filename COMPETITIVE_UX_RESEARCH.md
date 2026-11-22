# Evidence-led UX and premium positioning

Research checked 2026-11-22 UTC. Public marketing/docs observations are not competitor task tests. No competitor conversion rates inferred. Research is incomplete where sources refused access.

## Closest comparisons

HoneyBook and Dubsado are the first two comparisons for solo client-service workflows: acquisition, agreements, booking, invoicing and client collaboration. The prior November 18 report chose Bonsai for broader project/team workflows; retain it as a third benchmark, not silently discard that evidence.

| Source | Observed fact | MFH implication |
|---|---|---|
| https://www.honeybook.com/pricing | Annual-equivalent advertised Starter $29/mo, Essentials $49/mo, Premium $109/mo; client portal in Starter, scheduler/QuickBooks in Essentials, priority support/multiple companies in Premium | Package by workflow and service depth, not a feature-count wall or cheapest-price headline. Amounts are observed marketing, not a price change recommendation or total processing cost |
| https://www.dubsado.com/pricing | Advertised $335/yr Starter, $525/yr Premier; portal/email/calendar/mobile in both, scheduling/workflows/bookkeeping in Premier; 21-day no-card trial stated | Let people reach a useful outcome before complex setup. Do not promise features our deployment has not verified |
| https://help.honeybook.com/en/articles/11095702-how-clients-access-the-honeybook-client-portal | Direct portal supports temporary email magic link or password; file access also supports numeric code | Client experience needs a clear return path with scoped authentication/revocation. Existing MFH individual agreement links do not constitute a full portal |
| https://calendly.com/scheduling | Explicit progression: calendars → availability → meeting template → share link → optional automations | Make prerequisites and optional automation visible. Never label a stale/manual calendar snapshot full event sync |
| https://www.capterra.com/p/206389/Dubsado/reviews/ | Search-index excerpt describes learning curve/setup work; direct review page blocked (403) | Qualitative lead for follow-up, **not** a representative recurring-complaint finding |
| https://assembly.com/blog/dubsado-reviews | Search snippet calls product powerful but complex; publisher sells an alternative | Biased secondary lead only; do not use as independent prevalence evidence |

Software Advice and Capterra review pages returned 403. A guessed HoneyBook mobile-help URL returned 404 and is not evidence. Recurring complaint frequency, native task performance, actual onboarding and paid competitor workspaces remain unverified. Do not invent a review sample, ranking, conversion rate or win claim.

## Original improvements selected

1. **First useful result:** replace the three-step payment-first wizard with one profile form and a choice of agreement draft or client project. Business name optional; setup can be deferred. Preserve errors/drafts and verify the account again before saving.
2. **Trust:** remove unsupported same-day payout and superlative security assertions. No synthetic testimonials, scarcity, review stars or guaranteed outcomes.
3. **Mobile:** native capture of completed nonbillable time against real projects, using existing validation and atomic retry key. Avoid a WebView being described as a native client; do not claim offline durability yet.
4. **Retention:** original weekly-review article covers blockers, scope, capacity and correct invoice/payment distinctions, with a practical next-action checklist. It is not repetitive late-payment wording.
5. **Measurement hygiene:** preserve existing GA4, sanitize acquisition URLs, disable collection on private/auth/client-capability paths and honor DNT/GPC. No second analytics provider.

## Measurement plan and honest baseline

Existing GA4 property: `G-3PZE2XQMH0`; existing first-touch attribution and agreement events; server-confirmed signup attribution and Stripe records must remain authoritative for paid outcomes. No click is a signup or payment.

- Qualified visit: define the cohort before testing (target service-business acquisition pages plus a genuine task start); exclude staff/synthetic traffic. Page views alone are not qualified visits.
- Signup completion: confirmed auth account with first-touch source, not `/signup-success` views.
- Activation: first successfully saved useful object by a confirmed owner; report agreement, client/project and time separately, with agreed cohort window.
- Checkout completion/paid conversion: owned verified provider event, amount/currency/refunds accounted for, deduplicated by provider event/payment ID; query parameters and `is_pro` are not paid proof.
- Retention: same activated cohort returning to useful work at 7/30 days; last sign-in alone is a proxy, not retention.
- Experiment: compare matched cohorts before/after onboarding change, time to first saved useful object, setup abandonment and support errors. At current low volume, report raw denominators and qualitative sessions; do not pretend statistical significance.

Fresh operational auth baseline: 47 confirmed accounts, four created in last 30 days and four with sign-in in last 30 days; includes staff/test accounts. Counts cannot yield qualified visit conversion, paid conversion or retention without reconciled cohort data. See private funnel-baseline.json for all bounded counts and caveats. GA4 access and a staff/test exclusion definition remain necessary for a defensible funnel.

## Premium packaging recommendation — no prices changed

Keep current approved prices and existing billing unchanged. First make the current Professional offer demonstrably coherent: one client workflow, reliable records, understandable limits, privacy, fast support and migration guidance. Premium positioning should be earned by task completion and service evidence, not unsupported adjectives.

After real Calendar/Outlook/accounting and shared-team workflows pass acceptance, test a **Studio** package hypothesis around $59–79/month with explicit included seats and onboarding service. This is a research range, not approved pricing, a live offer or willingness-to-pay evidence. Competitor annual/monthly terms differ; do not compare only headline numbers. Validate support capacity and cost before promising priority service. No lifetime deal, surprise fee or change to existing subscriptions.
