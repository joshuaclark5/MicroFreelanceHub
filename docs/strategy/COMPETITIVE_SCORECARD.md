# Competitive execution scorecard: $10M annual revenue ambition

Research date: 2026-11-22. Internal decision document, not public comparative advertising. Goal from Joshua: $10,000,000/year within five years (~November 2031). No competitor conversion rate, financial forecast, or security guarantee is implied.

## Executive assessment

We are not above HoneyBook or Dubsado today. PR5 improved discovery/support presentation; it did not close the connected-workflow, mobile distribution, or integration gap. Win a narrow segment first: solo service professionals/small studios needing scope/change control, clear approvals and dependable billing handoffs. This segment choice is a hypothesis to validate, not a proven market.

## Sources and confidence

- H1 https://www.honeybook.com/pricing : fetched official page. Advertises $29/$49/$109 monthly equivalents billed annually; 30-day trial without card; portal, billing, calendar, automations, mobile, AI, QuickBooks, support. Product claims, NOT independent hands-on quality verification. Fee wording differs within page; do not repeat a single fee without checkout validation.
- D1 https://www.dubsado.com/pricing : official extracted annual plans $335/$525; portal, invoicing/payment plans, email/calendar/mobile; Premier scheduling, automated workflows, bookkeeping/Zapier. Response incomplete at extraction cap; absence is not evidence of unsupported features.
- D2 https://www.dubsado.com/free-trial : official extraction does not establish trial duration. Third-party current comparison says 21 days, old comparison pages say unlimited/3 clients. Duration remains provisional until official signup is inspected.
- C1 https://www.emakatiraee.com/blog/dubsado-vs-honeybook : November 2026 specialist comparison. Disclosed affiliate links, Dubsado specialist; useful qualitative evidence, not neutral measurement. Reports HoneyBook stronger guided setup/mobile; Dubsado stronger live-flow editing/branding. Says 21-day Dubsado trial.
- R1 https://sacra.com/research/honeybook-at-135m-arr/ : March 31, 2025 report, body estimates $140M ARR as of March 2025; title says $135M. Estimates, not audited accounts. Also reports $103M revenue in 2022. ARR is NOT recognized annual revenue or profit.
- R2 https://getlatka.com/companies/honeybook.com : search result estimates $74.2M revenue in 2024; conflicts with other sources/periods; do not average into invented certainty.
- R3 https://getlatka.com/companies/dubsado.com : fetched page explicitly says company has not published revenue; estimates $2.5M/year July 2025. Other databases differ drastically (IncFact search range $10M-$100M). Low confidence; current actual annual revenue unknown.
- U1 https://www.capterra.com/p/206389/Dubsado/reviews/ : search-index excerpt describes learning curve/setup work. Direct fetch 403. No complaint prevalence measurement.
- U2 https://www.g2.com/products/honeybook/reviews?qs=pros-and-cons : direct fetch 403. No review-frequency claim is justified. Search later failed; do not fabricate a large review sample.
- Local: PRODUCT_EXECUTION.md original feature ledger; PR5 live receipt from earlier verification; mobile README; app/pricing/page.tsx; app/api/stripe/checkout-plan/route.ts; payment and email source audit.

## Feature/benefit comparison

A = advertised officially, P = partial locally/production as stated, U = not established in this research. Competitor A does not prove implementation quality. Detailed original feature IDs follow in FEATURE_MATRIX.csv.

| Capability | Benefit | HoneyBook | Dubsado | MFH actual state | What must beat the benchmark |
|---|---|---|---|---|---|
| CRM/pipeline/contacts | No lost leads | A H1 | A D1 | P owner records/opportunities | import to useful pipeline without duplicate contacts |
| Intake/forms | Less back-and-forth | A H1 | A D1 | P text intake | accessible conditional forms, validation and mapping |
| Booking/rescheduling | Fewer scheduling messages | A H1 | A Premier D1 | P opt-in booking; lifecycle gaps | real calendar conflict test, client cancel/reschedule |
| Calendar sync | Avoid double bookings | A H1 | A D1 | manual Google availability only | Google/Outlook event+background sync, disconnect/retry |
| Proposals/agreement signatures | Faster client decisions | A H1 | A D1/C1 | bounded agreement signing live | proposal to approval to billing, role-safe client flow |
| Client portal | One clear client destination | A H1 | A D1 | individual links, not full portal | cross-project permissions, documents, actions, messages |
| Invoices/payment plans | Clear money expectations | A H1 | A D1 | drafts/issue + existing agreement payments | reconciliation, partial/refund/failure acceptance |
| Recurring billing | Less repeat admin | A H1 | A/C1 | recurring drafts + TEST lifecycle | explicit opt-in, cancel, dunning, webhook dedupe |
| Workflow automation | Less manual coordination | A H1 | A Premier D1 | not end-to-end verified | preview run, human checkpoints, replay/audit, no duplicate sends |
| Email/reply handling | Reliable conversations | A H1 | A D1 | outbound inbox verified; reply bounced | verified receiving address and thread/escalation routing |
| Accounting connection | Avoid double entry | A QuickBooks H1 | A bookkeeping D1 | QuickBooks/Outlook blocked/not complete | sandbox mapping+sync conflict/reconciliation tests |
| Projects/tasks/time | Understand delivery effort | A tasks/project H1; advanced U | project A; advanced U | P projects/time | team approvals, billable allocation without duplicates |
| Profitability/retainers | Spot unprofitable work | A finance H1 | detail U | P reports/allowance; full reconciliation absent | recorded costs/receipts, no synthetic revenue presented as real |
| Team/resource permissions | Delegate safely | A H1 | A D1 | P team/resources | role matrix tested with two accounts and revoked access |
| iOS/Android | Finish work away from desk | A H1 | A D1; C1 says basic | source/Expo preview, no device/store proof | actual sign-in, client/project flow, save/retry on both phones |
| Branding/templates | Professional presentation | A H1 | A D1/C1 | P templates/design | accessible branded client experience, sample clearly labeled |
| Support | Resolve issues rather than chat forever | A chat/email H1 | A chat/email D1 | reviewed search/draft; no service-level evidence | verified ticket receipt, owner, escalation, resolution metrics |
| AI assistance | Reduce work with correct guidance | A H1 | C1 only for specific features | no deployed support AI | sourced answers, abstention, scoped access, cost caps, evals |
| Export/migration | Avoid lock-in | granular coverage U | granular coverage U | P CSV | complete relational export, import preview/undo |
| Security/reliability | Trust critical records | independent evidence U | independent evidence U | RLS focused tests; broader audit pending | authorization matrix, restoration drill, incident process |
| Onboarding/trial | Reach value before paying | 30 days no card H1 | 21 days C1 provisional | free/$9/$29; no 7-day subscription trial found | first useful result measured; clear price/cancel terms |

## Brutal internal readiness score (not market review stars)

Scale 0 absent; 1 prototype or serious gaps; 2 live bounded slice; 3 complete tested journey; 4 measured dependable operation; 5 demonstrated superior outcome in matched customer tests. Weighted total = sum(weight * score / 5). Assessments are judgment calls based on evidence, not telemetry-derived product quality.

| Dimension | Weight | MFH score /5 | Evidence gap |
|---|---:|---:|---|
| Connected client journey | 20 | 1 | portal/orchestration incomplete |
| Billing/reconciliation | 15 | 2 | full recurring lifecycle and allocations incomplete |
| Onboarding/activation | 10 | 2 | UI tests, no activation cohort proof |
| Native mobile delivery | 15 | 1 | bundles/preview, no installed-device proof |
| Provider integrations | 10 | 1 | manual sync; Outlook/accounting incomplete |
| Support/resolution | 10 | 1 | reply bounce, no verified ticket SLA |
| Reliability/security/recovery | 10 | 2 | scoped checks, no comprehensive audit |
| Acquisition UX/accessibility | 5 | 2 | responsive checks, no broad usability cohort |
| Analytics/retention evidence | 5 | 1 | event/code pieces, cohorts not established |
| TOTAL | 100 | 28/100 | internal readiness, not competitive market share |

HoneyBook and Dubsado: numerical quality scores NOT YET ASSIGNED. Official feature lists and affiliate commentary cannot establish their failure rates, support resolution, or real onboarding speed. Do not invent 80/100 scores to make comparison look complete. Apply the same rubric after authorized test-account journeys. Target >=85/100 plus no critical failures; a score is not a release waiver. Retest all products on identical representative jobs, not a checklist designed to favor us.

## Customer-friction opportunities and evidence limits

1. Setup complexity: U1 excerpt + C1 specialist experience corroborate setup/learning friction, not its prevalence. Build industry-specific starter workflows and assisted import. Validate median time to first useful client-ready artifact with 10 then 30 target users.
2. Mobile depth: C1 describes Dubsado mobile as basic, H1/D1 advertise apps. Test equivalent real jobs before claiming superiority. Ship fewer complete mobile workflows rather than navigation to unfinished screens.
3. Automation control: C1 describes tradeoffs in editing running workflows and conditional branching. Opportunity: readable preview, approval gates, pause/retry, inspectable logs. Validate with users who currently pay for workflow setup.
4. Price/fees, fragmented support, migration friction: plausible discovery hypotheses, NOT established recurring complaints from the blocked review pages. Interview users and sample dated reviews across at least two independent sources before prioritizing based on frequency.
5. Own reply bounce is direct evidence of our support gap. Fix receiving/Reply-To verification before advertising great support.

## Paywall and trial decision

Current source: Free (first three contracts), Starter $9/mo, Professional $29/mo. checkout-plan creates subscription checkout with no trial_period_days/trial_end in subscription_data. The test subscription sandbox is unrelated. Public pricing read-only fetch is client-rendered, so code evidence is not a fresh authenticated checkout proof. No paid checkout was created in this audit.

Recommendation for approval: test a 14-day no-card premium trial for NEW accounts against the existing free entry point; preserve current customers/prices. A seven-day arm is reasonable only once median first value is under a day and a real client can complete a cycle in that window. HoneyBook currently advertises 30, not 7. Do not assume shorter trials convert better. At trial expiry retain read/export access and drafts; require explicit checkout for paid continuation. No hidden auto-enrollment.

Before implementing: define eligibility, abuse controls, entitlement source of truth, UTC boundary, downgrade behavior, Stripe/webhook idempotency, price/renewal disclosure, cancellation, reminder policy, privacy/consent, tests with a test clock. Do not confuse our SaaS subscription trial with clients' recurring agreement payments.

Packaging hypothesis, not approved prices: Solo $39, Studio $79, Team $149 monthly, with explicit seats/usage/cost model; annual offer only after unit economics and cancellation/refund disclosure are reviewed. Do not raise existing accounts or advertise feature access before entitlement audit. At current $9/$29 mix premium economics are substantially harder.

Claim audit blocker: current pricing says "Automated dunning emails" but full collections workflow remains unverified. Legacy agreement checkout also contains a monthly subscription branch: do not broadly assert every recurring path is disabled just because the new sandbox is test-only. Audit gates/webhooks in test mode before any live activation or marketing changes. Preserve existing billing.

## Conversion and retention measurement

Existing GA4 route guard is present. No new analytics service. Define funnel: qualified acquisition visit (target segment+intent, not raw bot traffic), completed signup, activated account (real first client + shareable artifact or confirmed booking, no synthetic/internal accounts), checkout started, paid invoice for SaaS subscription, retained paid account D30/D90, gross/net revenue retention, support contacts per activated account.

Use server webhook truth for paid conversion, not thank-you-page views. Cohort by signup week and channel; dedupe events and exclude staff/test. Keep client text/email/payment details out of events. Audit consent/settings and current dashboards before expanding tracking. No measured conversion baseline available yet; 47 historical accounts are not paying-customer evidence.

Test order: correct claims/working reply route -> first-use workflow -> public pricing/feature clarity -> trial length/packaging. Pre-register primary outcome (90-day gross profit per qualified visitor), guardrails (refunds, churn, complaints, support load), and minimum detectable effect/sample calculation using observed baseline. Do not declare a win from a handful of clicks.

## Five-year revenue model: goal, not forecast

$10M recognized annual revenue != $10M ARR at year end != profit != client payment volume. Model subscription revenue only; do not book Stripe payment volume or payment fees as margin without reconciliation.

| Realized monthly revenue per paying account | Average paying accounts for $10M annual revenue |
|---|---:|
| $9 | 92,593 |
| $29 | 28,736 |
| $59 | 14,125 |
| $79 | 10,549 |
| $99 | 8,418 |
| $149 | 5,593 |

At $79 and 10,549 average active payers: ~$833k MRR / ~$10M ARR. At hypothetical 3% monthly logo churn, ~316 accounts/month must be replaced merely to hold scale; annual retention ~69%. At 1% churn, annual retention ~89%. Illustrative 3% qualified-visit-to-paid conversion requires ~10,549 qualified visits/month just to replace churn at that scale, before growth. These are assumptions, not measured rates.

For ~$10M recognized revenue in year five at $79, an approximately linear path from 7,000 to 14,100 paying accounts DURING year five yields ~10,550 average payers. Exit ARR then ~$13.37M, not $10M. With 3% churn and that year's approximate average base, gross additions must cover ~7,100 net growth + ~3,798 churn replacements = ~10,898/year (~908/month). At hypothetical 3% visitor-to-paid, ~30,300 qualified visits/month. Acquisition efficiency, support capacity and a team are prerequisites, not cosmetic details.

Illustrative scenarios, not probability estimates: 1,000 payers at $49 -> $588k ARR; 5,000 at $69 -> $4.14M ARR; 10,549 at $79 -> ~$10M ARR. We lack observed paid conversion/churn/CAC to choose a credible base-case forecast. First evidence milestones: 10 paying non-staff accounts, then 100 retained payers, then repeatable acquisition with positive contribution margin. A $10M target is ambitious but mathematically possible; not currently a defensible expectation.

Example acquisition gate: at $79 ARPA and assumed 80% contribution margin before acquisition, monthly contribution ~$63; 12-month CAC payback implies CAC <=~$758. Verify actual hosting, inference, payment, onboarding and support costs; do not assume margins from subscription revenue alone.

## Execution order / measurable finish lines

P0: verify receiving mailbox and reply routing; eliminate unsupported pricing claims after entitlement audit; confirm test phone compatibility/actual install; complete one cross-device job; close crash/auth/payment isolation failures. No new login needed for public research/source tests. Physical-device or Mac access remains absent; do not claim an installed iPhone test from Windows.
P1: complete client portal + lead/intake/booking/agreement/invoice handoff, integration retry/disconnect and explicit billing lifecycle. Customer-facing failure messages and no double writes are acceptance gates.
P2: implement approved trial experiment and real funnel; 10 design partners complete matched workflow; collect support resolution evidence and retention.
P3: grounded support AI with no-spend provider feasibility, data isolation, source citations, refusal/uncertainty, escalation/ticket receipt and adversarial evals; migration tooling and workflow differentiators.

Each week: update matrix evidence, release URL/SHA, score changes and failing gates. No points for unshipped code. Unfinished features remain explicitly partial/blocked; do not claim whole-product completion.

## Current-turn verification receipt

- Read-only real browser check on live /pricing confirmed first 3 contracts free, $9 Starter, $29 Professional, no seven-day trial claim, and the automated-dunning claim. No checkout clicked, Stripe object created or payment sent. This supersedes the earlier lightweight-fetch limitation for visible pricing, not for Stripe subscription settings.
- Product-core and mobile session-action tests passed using the existing source checkout's installed TypeScript through NODE_PATH (the managed worktree lacks node_modules; initial direct commands failed for that reason). No package purchase/install needed.
- Existing Metro server on port8081 returned HTTP200 Android/iOS manifests containing launchAsset. No new server started. This does not prove phone compatibility, installation or account workflow on devices.
- Revenue model arithmetic and 50 unique feature matrix rows validated. Score =28/100 using stated rubric. No product code, prices, billing, entitlements or customer records changed in this strategy increment.
- No current additional login needed for these tests. To complete iOS native/device tests, a controlled Mac/Xcode/device environment or the owner's device participation is needed. Do not ask for passwords in chat. Competitor authenticated journey testing is not done; no new paid trials/accounts created.
- Next execution priority is a meaningful completion gate (device/core client workflow and reply receiving), not another sequence of minor support-form refinements. Prior partial mobile/paywall/provider items remain open.
