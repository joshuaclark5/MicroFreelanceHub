# Sitewide seasonal offer verification

Request: make the Black Friday offer easy to redeem and visible on SEO pages.

- Existing checkout automatically selects the active offer for annual plans and validates first-time eligibility server-side. No promotion code added or required; no Stripe/coupon changes.
- Root public banner replaces home/pricing-only placements. Public articles, templates, tools and profession pages share one banner; customer booking/agreement/payment and private workspace flows excluded. Print hidden.
- CTA links to /pricing?billing=annual and pricing initializes annual selection. Full navigation intentionally works even when already on pricing.
- Banner explains first-year discount, first-time eligibility, renewal at regular annual price, expiry and no code needed. Terms page clarifies application.
- Build and TypeScript passed. Existing offer windows/coupon tests passed.
- Four-width browser suite passed (320/390/768/1440): home, articles, templates, client-message tool, actual profession/caterer route; banner unique; CTA selects annual; discounted amounts and checkout payload; ineligible error and explicit regular-price opt-out; Christmas, expiry and unavailable state; overflow/accessibility checks. Fictional auth/offer APIs and intercepted checkout; no charges/messages/customer writes.
- Phone SEO and desktop pricing screenshots reviewed. No metadata/canonical/sitemap code changed. Indexing/ranking not claimed.

Local tested candidate only. Production publication still needs supported Vercel deployment-access recovery and exact-commit/live verification. Do not claim new banner coverage live yet.

## Released and verified — November 24 continuation

PR39 https://github.com/joshuaclark5/MicroFreelanceHub/pull/39 merged as 845d2f2b03dd7d5b2366cc53224de81aff371ff0. Authenticated GitHub CLI used after managed publisher readiness timed out; exact preview and production Vercel status both succeeded. Earlier Vercel access blocker did not recur for this candidate.

Public shared-banner assets verified on homepage, pricing, articles and profession/caterer. Baseline titles/canonicals/x-robots-tag, robots.txt and all 1,523 sitemap URLs preserved. Live anonymous browser checks passed at 390/1440 for articles, profession, templates and public tool: exactly one banner, no horizontal overflow, no-code wording, CTA opens annual pricing with $144 Starter first-year price. Non-read network requests blocked; no checkout, charges or customer writes. Phone pricing screenshot inspected.

Receipts: artifacts/sitewide-offer-live-baseline.json, sitewide-offer-live-assets.json, sitewide-live-browser.json and sitewide-live-390.png / sitewide-live-1440.png. Earlier four-width fixture tests and production build remain applicable to unchanged candidate source; seasonal-offer unit suite rerun and passed this turn.

The overall customer-quality objective remains active: this completes public seasonal-offer coverage, not full competitor workflow parity, persistent end-to-end billing/signature acceptance or store publication.
