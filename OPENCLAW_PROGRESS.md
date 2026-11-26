# MicroFreelanceHub improvement project — working checkpoint

## Ownership and current activity

- Project active; primary module **M01 — Navigation and onboarding**. Current IDs: M01-001, M01-002, M01-003; G00 environment/setup prerequisites.
- Integration and sole production-release owner: parent `/root`. Specification helper owns docs only; no release authority delegated. Parent must update worker status when execution changes.
- Last activity: 2026-11-26, specification preservation/validation completed (UTC; November 25 Eastern). Exact generated timestamp is in `docs/checklist/requirements.json`.
- Active work reported by parent: OpenClaw reporting setup worker `c96a3e71`; environment/M01 browser audit worker `68f1e810`; parent baseline dependency install (session 36862, `baseline-install.log`) then baseline build. Do not start duplicate workers/builds; reconcile these statuses on resume.
- Next action: reconcile environment and existing M01 behavior, including authenticated navigation/onboarding. Candidate first slice is M01-011 mobile menu explicit Close and heading-focus handoff, pending browser reproduction; not yet an implemented or verified gap.
- No application code, database, deployment or provider configuration changed by specification setup.

## Canonical records

- Immutable full specification: `docs/checklist/MicroFreelanceHub_OpenClaw_Detailed_Checklist.txt`.
- SHA256: `9a640cd410efd144a69495ea8183ccf119cd2bf55c0f506410f4f0fffa967ffb`; 317,471 bytes; exact attachment byte copy.
- Sole requirement inventory: `docs/checklist/requirements.json`. Initial state: **1,220 Unverified / unchecked**, not 1,220 missing features. 33 G00 rules + 1,187 requirements across 35 modules; all per-module index totals match; all 113 original coverage entries preserved.
- G00 and M35: `docs/checklist/sections/G00.txt`, `docs/checklist/sections/M35.txt`. Always read G00 plus active module and relevant dependencies; apply M35 to every release.
- Operating prompt summary: `docs/checklist/PROJECT_OPERATING_RULES.md`.
- Sections preserve every original byte: concatenate the 39 source parts in inventory order to reproduce the unchanged master. `python scripts/verify-checklist.py` passed: master/section hashes, IDs/text/counts, coverage and status invariants.

## Repository and environment reconciliation

- Repository: https://github.com/joshuaclark5/MicroFreelanceHub.
- Canonical existing checkout per instructions: `C:/Users/joshu/Downloads/MicroFreelanceHub-GitHubPush/MicroFreelanceHubFrontend`; preserved, not reset or cleaned.
- Isolated working checkout: `C:/Users/joshu/mfh-checklist-20261125`.
- Branch: `openclaw/checklist-improvement-20261125`; pre-change/base HEAD `e0793e9be3cda78c8591105726dd841377dad33c`, fetched `origin/main` (PR46 merged). Setup documentation not committed yet.
- Starting conversation checkout: `C:/Users/joshu/.openclaw/worktrees/d2d857b0f46402ce/neat-prawn`, branch `openclaw/global-time-off-proof`, HEAD `9456746`; its dirty CLI marker, artifacts and HoneyBook audit left untouched. Do not treat this newer branch's extra work as production without reconciliation.
- Production URL: https://www.microfreelancehub.com. Latest prior verified release in supplied handoff: PR46/e0793e9, production provider success at 2026-11-25T23:00:27Z and public invoice route check at 23:00:28Z; parent must fresh-read actual current deployment before release.
- Production branch/auto-deploy policy, staging URL/database IDs/provider modes, current authentication, workspace publication binding and recovery references: parent verification pending. No data-affecting changes allowed on assumed targets.
- Baseline build: parent is installing dependencies with `npm ci --ignore-scripts --no-audit` before the new baseline build; not completed yet. Prior PR46 had passing production build, SQL/API checks and hosted verification. This is prior evidence, not a new baseline run for this project.
- Runtime confirmed by parent: Astra (`openai/gpt-6-astra`), High effort, fast mode off. Parent saved lasting project instructions/pointers in `C:/Users/joshu/MEMORY.md`.

## Preserve prior completed and unfinished work

Existing research and strategy docs remain evidence, not a second execution backlog. Relevant entry points: `docs/strategy/DELIVERY_STATUS.md`, `docs/strategy/CUSTOMER_WORKFLOW_20261123.md`, `docs/strategy/CUSTOMER_QUALITY_SCORECARD.md`, `docs/strategy/CALENDAR_SECTIONS_AND_MULTI_DATE.md`, `docs/strategy/INVOICE_TERMINAL_CONFLICTS.md`, `docs/strategy/LOCAL_ENVIRONMENT.md`; reconcile dated claims rather than copying statuses blindly.

External private handoff reference: `C:/Users/joshu/mfh-overnight-evidence-20261125/CONTINUATION_20261125_INVOICES_IOS.md`. Preserve source work on `openclaw/mobile-feature-parity` (observed worktree HEAD 5ac3022), Android 0.1.9 internal release, unreleased native invoices and unfinished iOS gates. Existing calendar/report-email/invoice fixes remain intact. Prior full invoice backup/restore/rollback receipts cover that change only; fresh admission/recovery needed for new data changes. No claims of full parity or all journeys verified.

## Counts and evidence

| Status | Requirements |
| --- | ---: |
| Unverified | 1220 |
| Existing verified | 0 |
| Partial | 0 |
| Missing | 0 |
| Blocked | 0 |
| Deferred | 0 |
| Implemented in staging | 0 |
| Published verified | 0 |

These are initial inventory classifications, not a judgment that existing features do not work. Update requirement-level evidence before changing counts; reuse valid earlier evidence only where it covers the exact acceptance.

## Reporting, notifications and continuation

- Required job: `MicroFreelanceHub hourly build report`. Parent inspected gateway job inventory; no equivalent appeared. Reporting worker `c96a3e71` owns setup/test/delivery verification; pending, no claim of active hourly reporting.
- Job ID / next scheduled run (America/New_York): pending parent setup.
- Private notification destination: parent verification pending; do not guess. Telegram conversation lookup timed out during initial setup.
- Reporter may only read progress and deliver; never edit code, deploy, alter worker state or start coding. Run independently of foreground work where supported; accurately report pause/block/staleness.
- Pending release outbox: none. No new feature published by this project yet. Key future entries by requirement IDs + deployment, record Pending/Accepted/Failed, reconcile uncertain sends before retrying.
- Supported development continuation mechanism: parent establishing; hourly reporter is not the development worker. No expired overnight automation restarted.
- 24/48-hour checkpoints: measured from project start; parent to record exact start timestamp and upcoming checkpoint times. Report actual verified/published scope and blockers, never claim completion from elapsed time.

## Exact resume instruction

Read this checkpoint, G00, M01 and M35. Reconcile actual branch/status/deployment and active worker before starting any mutation. Finish environment prerequisites and M01 existing-feature inspection. Record a bounded real gap with evidence, implement on isolated branch, run relevant acceptance/build, then have sole release owner publish and verify safely. Update this file and requirements.json after each meaningful result; continue independent work if a provider prerequisite is blocked.
