# Customer-quality acceptance scorecard

Updated 2026-11-24 after the overnight handoff. This is an engineering evidence checklist, not a customer star rating. No verified new MicroFreelanceHub rating or overall HoneyBook parity is established.

## Evidence boundary

Reconciled saved production receipts and browser reports for PR22-25; these are prior execution results, not newly repeated live tests. GitHub open-PR listing was checked: none of PR22-25 remains open. Unrelated PR1 remains open and was not reviewed or changed. Existing customer records, billing and subscriptions were not changed. Overnight scheduling remains stopped.

## Accepted improvements and remaining acceptance gates

| Area | Accepted evidence | Remaining gate / honest comparison |
| --- | --- | --- |
| Google identity | Prior fresh chooser confirmed the matching green logo; PR19 privacy/name release | Resolved observed mismatch; not a competitor-wide score |
| Calendar | Prior PR18 mobile/date/timezone checks | Broader session/event workflows remain below observed HoneyBook breadth |
| Portability | PR20 scoped CSV export and account/completeness/formula guards | Not a full backup; import, tags and saved-view breadth remain gaps |
| Login and first-use forms | PR22 exact merge `05425a615e363cf16c184219adf8c075518c3a38`, production asset receipt; fictional browser tests | Login destinations and empty-choice recovery accepted; full client-to-project-to-document-to-customer-preview journey still unverified as a whole |
| Public template discovery | PR23 exact merge `e5037e20187802d06c81c18e1e2a4ec5377d05cd`, asset receipt, three-width tests, unchanged 1,522 sitemap URLs | Email filter/reset/retry accepted; reusable templates, folders and editing workflows remain gaps |
| Account deletion | PR24 exact merge `ce77c1f9fad01151a08bb92ac9415915403995c4`; hold/privacy markers and two-width zero-mutation tests | Containment only. Self-service deletion unavailable; concurrency-safe lifecycle is not implemented |
| Team availability | PR25 exact merge `92fc27c759efc5ac3262ae103594351feb77b15c`; markers and 390/1440px zero-mutation tests | False waitlist enrollment removed; this is NOT delivery of team collaboration |
| Reporting | Prior source audit and mocked API/date tests | Invoice face value is not collected revenue; payment-backed collections/refunds, conversions and richer breakdowns remain gaps |
| Ratings | Earlier G2/Maps competitor observations only | No new MFH customer-rating evidence; do not generate a star score from passed tests |

Local receipts: `artifacts/pr22-live-assets.json`, `pr23-live-assets.json`, `pr24-live-assets.json`, `pr25-live-assets.json`; `team-after-browser.json`, `deletion-hold-browser.json`. These artifacts are local evidence, not guaranteed to be present in a public repository clone.

## Next acceptance work, in priority order

1. **Deletion lifecycle:** settle record-retention/counterparty access policy, then implement a durable account state shared by checkout, workers and webhook reconciliation. Cover previously issued checkout sessions, new-customer races, recurring agreement payments, incomplete billing inventories and delayed events. Preserve the hold until isolated sandbox tests prove recovery/isolation. No live cancellation/deletion tests. Detailed source-backed requirements remain in the private workspace file `C:/Users/joshu/mfh-deletion-lifecycle-followup.md`.
2. **Full customer journey:** independently verify client creation -> project/stage selection -> task -> agreement/invoice -> customer preview with fictional fixtures at phone/desktop widths. Check context retention, saved/reloaded values, failure recovery, signatures/payment-state wording, and preview isolation. Existing per-screen tests do not establish this whole journey.
3. **Reusable documents:** compare actual HoneyBook reuse/folder/editor states with MFH; implement only verified gaps with clear saved-versus-project-specific semantics and existing plan/SEO boundaries.
4. **Reporting breadth:** establish authoritative payment/refund data and currency/date semantics before adding collected-money metrics. Never relabel invoice face value as revenue.

Completion requires evidence for the remaining gates, not a target star rating. The mission remains active. Neither the overnight deadline nor successful containment makes the broader objective complete.
