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
