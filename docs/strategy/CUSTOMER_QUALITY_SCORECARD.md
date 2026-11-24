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

## Connected journey verification - 2026-11-24 17:18 UTC

New `scripts/test-customer-journey-browser.cjs` ran against public production-rendered pages at 390/1440px with fresh isolated browser contexts. All workspace APIs were fictional; other API requests and external origins/writes were blocked. Four records were created only in test memory per viewport (client, project, task, agreement link); five intercepted write attempts include one intentional failed task save. No production records, messages or payments changed.

Verified via actual navigation: client card -> filtered projects -> client-prefilled project form -> task form with project retained -> failed save/draft recovery -> exactly one saved task after retry and reload -> project next-action text -> project-prefilled agreement link form -> exact selected agreement ID and review href despite duplicate agreement titles. No horizontal overflow or page runtime errors. Phone project and desktop agreement-link screenshots visually inspected and readable.

Evidence: `artifacts/customer-journey/results.json` and screenshots. This narrows the full-journey gap; it does not close it. Database persistence/RLS, global signed-in navigation (the fixture sidebar is signed out), document creation/editing, invoices, customer preview, signatures and payment processing were not tested in this run. Stage and available agreements were seeded fixtures, not created through their UI. No app implementation changed, so no build or deployment claimed. Next journey gate is the editor/preview boundary using equally isolated fixtures.

## Customer preview/payment-state verification - November 24, post-handoff

Reused and strengthened `scripts/test-client-payment-view.cjs`: catch-all network interception now blocks unexpected API calls and non-read requests; explicit fictional Supabase reads and payment-confirmation responses remain intercepted. Fixed an obsolete blue-button expectation to the green specified in `app/direction04.css`, not an application regression. Added client-only control checks, signing-dismissal focus restoration, unavailable-document retry and full-page evidence captures.

Production-rendered browser checks passed at 320/390/1440px: missing payment confirmation stays pending; simulated confirmed partial payment shows remaining balance, not paid-in-full; agreement-only copy excludes payment; client view omits provider-role and edit controls; signing dialog can be dismissed without submitting; unavailable fixture recovers via Retry. No unexpected writes; no real signatures, messages or charges. Full phone agreement-only screenshot and desktop partial-payment screenshot visually inspected. Evidence `artifacts/client-payment-view/results.json` and full-page captures. Separate mocked unit suites for agreement context, handoff and payments passed, including account-change and wrong-document receipt rejection. These do not prove database transactions/RLS or actual Stripe settlement.

No application changes/build/deployment in this batch. Editor save through customer preview is still not one continuous browser run; invoice creation, real isolated persistence, signature submission and sandbox Stripe completion remain acceptance gaps. The whole objective remains active.

## Continuous editor-to-customer-preview acceptance - November 24

Extended the existing `scripts/test-connected-handoff-browser.cjs` rather than duplicating its owner/session fixture. Production-rendered checks passed at390/1440 for project -> prefilled brief -> scope/payment review -> direct editor -> fictional document save -> correct project/agreement return -> explicit link -> reload -> separate anonymous customer preview of the same saved fixture document. Customer view retained title/scope/client and kept payment locked pending signatures; owner edit controls were absent. Revoked-project fixture prevented opening a saveable editor. Phone editor and desktop customer-preview screenshots inspected. Existing editor defaults yielded a $100 base plus the displayed 3.9% fee; no charge was attempted and fee policy was not changed.

Evidence: `artifacts/editor-customer-handoff/handoff-browser.json`, editor/handoff/customer-preview screenshots. All Supabase and workspace API requests were intercepted; document/link saves existed only in test memory. No actual customer, signature, invoice or payment mutation. This closes the continuous *UI fixture* editor-to-preview gap, not real database persistence/RLS, sandbox Stripe settlement, actual signature verification or invoice-workspace integration. No new application build/deployment warranted for a test-only change. Safe deletion lifecycle and broader reporting/template/automation gaps remain; goal active.

## Invoice workflow audit and issued-form correction - November 24

Invoice API suite passed 10 groups. Isolated file-backed PGlite suite passed 15 SQL groups including exact totals, retry identity, ownership, immutable issued snapshots, recurrence, numbering, allowance rollback and reopen persistence. PGlite serializes submitted statements: these results are not deployed-schema compatibility or multi-connection PostgreSQL contention proof.

Production-rendered fictional UI passed four-width review/retry/accessibility checks but screenshots exposed an issued invoice still labeled as an editable draft. Candidate now disables that retained form when its saved invoice is no longer a draft, explains the state and moves Start another draft outside the disabled fieldset. It does not change snapshots, billing, sends, money calculations or schema. The latest main content update was merged before the final build.

Combined production build and standalone TypeScript passed. Updated local production-browser checks at320/390/768/1440 passed: exact cents, client/project mapping, stable retry operation, explicit reviewed issue, disabled issued form, new-draft reset without an extra saved record, account-switch retention and axe/overflow. Phone/desktop screenshots inspected. Evidence `artifacts/invoice-acceptance` (baseline/API/SQL/build) and `artifacts/invoice-issued-local` (corrected UI). No real invoice mutation or charge. Release still pending at this checkpoint. Post-handoff test/scorecard improvements are included in the same branch; they do not add product features.
