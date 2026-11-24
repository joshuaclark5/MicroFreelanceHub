# Customer-quality mission — November 24, 2026

Joshua authorizes an overnight customer-perspective audit and implementation effort, using HoneyBook as a benchmark. Preserve MicroFreelanceHub's identity and existing customer records, prices and permissions. Improve real outcomes; do not claim feature parity or a 4.9-star rating without evidence. No customer messages, campaigns, live charges or invented consent. SMS remains subject to the existing $20/month total ceiling and pending business setup.

## Review evidence

Observed in the signed-in managed browser, November 24:

- [G2 product reviews](https://www.g2.com/products/honeybook/reviews?qs=pros-and-cons): **4.4/5, 253 reviews**. Search index had 4.5/252; use the directly observed current page, not the stale snippet. G2's AI summary lists payment issues, expense, integration limits, workflow limitations and reporting. Those summaries are not independent findings.
- G2 reviewer Liz K. (August 11, 2026) praises templates, automations and SMS but reports clunky template discovery and reduced mobile functionality. Graeme R. (August 5) praises consolidation and reliability, wants a proofing integration and branded galleries. Nikki M. (June 25) praises organization/support but finds template edits across automations cumbersome. Older excerpts mention price increases and basic conditional workflows. Do not treat every historical complaint as a current missing feature: reviewers also mention Automations 2.0.
- [Google Maps search for the company](https://www.google.com/maps/search/HoneyBook+San+Francisco): verified the HoneyBook listing at 539 Bryant St with honeybook.com, **3.7/5, 189 reviews**. Reviewed normal ordering and a lowest-rated sample. Positive comments praise consolidation and booking; negative comments report pricing jumps, support escalation difficulty, payment delays/duplicate charges and slow loading. These are reviewer allegations, not independently verified payment incidents. Lowest-first sampling deliberately overrepresents problems; it is not a representative sentiment estimate.
- Raw bounded review evidence is local/private: `C:/Users/joshu/honeybook-g2-review-evidence.txt` and `C:/Users/joshu/honeybook-google-maps-lowest-evidence.txt`. Do not publish customer/account screenshots or large verbatim review extracts.

## Evidence-based comparison checkpoint

| Surface | HoneyBook observed | MFH current / assessment |
| --- | --- | --- |
| Sign-in trust | Not scored against competitor | Verified MFH Google logo was the older black M; matching green mark now Google-verified, published and confirmed in a fresh account chooser. Privacy and full-name remediation released in PR19. |
| Calendar | Month grid, timezone, session types, booked sessions, connected calendar, project/payment categories | MFH grid/zone selection fixed; broader event-category and session-management coverage still below benchmark. No overall parity claim. |
| Templates | Grid/list controls, search, sorting, folders, starter templates, reusable templates | MFH public library searches/filter types; personalized reusable-template organization and unified editor coverage remain gaps. Worse for this workflow. |
| Contacts | Columns, views, filters, Google import, tags and linked projects | MFH contact/project links and notes exist; filtered, guarded CSV export added in the current portability release. Import/tags/view depth below benchmark. |
| Reporting | Payment/leads/booked-client/team reports, exports and conversion summaries inspected | MFH invoice face value and recorded-time reports/export exist. These are not revenue/cash-flow reports. MFH remains below this reporting breadth. |
| Pricing transparency | Mixed review evidence; price-increase complaints | MFH displays exact first-year/renewal totals and preserves existing subscriptions. Useful safeguard, not proof of better value. |
| Reliability/support | Mixed reports; current account appears functional | MFH retry/account-isolation checks exist. Need customer-facing support/recovery path audit, not a superiority claim. |

## Priorities and boundaries

1. Finish Google branding remediation, deploy factual privacy content and consistent full product name, and request re-verification only after live verification. Google approval is external; don't claim the logo is public until checked.
2. Customer data portability: add clearly scoped CSV export for connected clients/projects/tasks with formula escaping, explicit filtered-vs-complete semantics and session/account guards. Never silently export clipped data as a full backup.
3. Inspect full customer workflow visually: new client → project → next task → agreement/invoice → customer preview. Improve missing prerequisite guidance and common dropdown choices, preserving save/retry safeguards.
4. Audit template discovery and editing against actual HoneyBook screens; retain public URLs, substantive SEO pages and free/paid boundaries.
5. Audit billing cancellation/deletion interactions and payment-status explanation carefully. Do not change active subscriptions, delete an account or submit a charge while testing.
6. Record each released change, exact commit/deployment, fictional test boundaries, screenshots inspected and remaining gaps. Stop new work at the end of the authorized overnight window; provide a short morning summary with actual required user actions.

## Brand verification issue observed

Google's Branding screen saved the matching 120×120 green website mark but continues displaying the previously verified logo. Its issue dialog lists insufficient privacy content, logo identity, a formerly login-gated/unclear homepage and an app-name mismatch. Current homepage is public and uses the full visible name; metadata still shortened it to MicroFreelance. The privacy update must describe Google profile data, optional busy-only calendar access, actual processors, AI editing, storage, retention and request paths. No OAuth client IDs, redirect domains, scopes or credentials should be changed merely to fix the logo.

## Portability verification

Filtered saved-record CSV export covers clients, stages, projects, tasks and agreement links, with relation names, formula escaping and account/incomplete-load guards. Production build, TypeScript, unit tests and four-width browser export checks passed. Existing workspace regression passed at 320 and 1440 pixels; export screenshots at those widths visually inspected. Fictional fixtures only; no customer writes. Export is not a complete account backup.

## Google verification resolved

PR19 privacy/full-name changes are live. Google approved re-verification and branding was published; a fresh Google chooser visually confirmed the current green website mark. Earlier issue notes above are historical, not an outstanding blocker. No OAuth credentials or redirect domains changed.
