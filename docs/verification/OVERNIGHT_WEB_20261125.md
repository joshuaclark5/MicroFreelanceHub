# Overnight website candidate — November 25, 2026

## Scope
- Feedback footer sends to fixed admin@microfreelancehub.com through existing Resend infrastructure, not directly from the browser.
- Private service-only feedback_reports receipt stores report text, optional reply email, hash and HMAC network rate key before dispatch.
- Stable request ID; an uncertain provider/process outcome never automatically sends a second copy. Check/retry returns stored status. Accepted means provider accepted, NOT inbox delivery.
- Hourly DB intake limits: 5/source, 100 overall. Failed/unknown reports remain saved for operator review. No page URL/account/client data added automatically.
- Calendar: green working-hour pattern marker, amber count badge, accessible day description, legend and clearer selected-day agenda. Counts reflect current attendee/canceled filters. Green is NOT proof of free slots; time off/external events remain separate.

## Verification so far
- node scripts/test-feedback-api.cjs: passed (fictional provider; no emails).
- node scripts/test-feedback-db.cjs: passed actual migration in isolated PGlite, including anonymous/authenticated denials and limits.
- TypeScript: final candidate passed `npx tsc --noEmit --pretty false` after the completed build. One concurrent run hit regenerating `.next/types`; the sequential rerun passed.
- `npm run build`: final candidate including calendar layout and all contact corrections passed (exit 0). Existing Browserslist age/edge-runtime warnings remain; build config skips lint/types, so the independent typecheck above is required.
- Calendar day, booking-link sharing and feedback browser suites each passed at 320, 390, 768 and 1440px, with axe WCAG checks and no horizontal overflow. Browser APIs were intercepted with fictional records; no real emails or database writes.
- Calendar coverage: recurrence/exclusions, timezone isolation, Due-next ordering, management links, account continuity, bounds/errors, month jumps, filter retention and ignored stale responses.
- Sharing coverage: keyboard-accessible native disclosure, enabled-only link copying, manual clipboard fallback, owner/gate/error guards and ignored stale response.
- Feedback coverage: lost response, saved/unknown, provider acceptance (not delivery), exact same-ID retry, retained draft and new-report reset.
- Explicit UTC and America/New_York hydration smoke passed on calendar/support using the completed production build, including the midnight local-date boundary and zero hydration/page errors. Receipt/screenshots: `artifacts/calendar-hydration-browser/`.
- Live production rollout and provider/mailbox receipt remain parent-owned and unverified by this lane. Do not claim live.

## Release prerequisites and operator recovery
1. Apply supabase/migrations/20261125060000_feedback_email.sql to isolated staging; verify grants/claims. Then apply production before web rollout. Existing legacy feedback table/widget unaffected by this migration.
2. Server needs SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL and existing RESEND_API_KEY. Sender support@microfreelancehub.com uses existing domain sending identity; recipient is admin@microfreelancehub.com. Reply-to is optional reporter email, never used as recipient.
3. Run build and fixture browser tests. One authorized synthetic live report must be verified in provider and receiving mailbox by parent; no real email has been sent by this worker.
4. For saved failed/unknown/sending receipts, inspect private feedback_reports by exact report reference. Provider idempotency key is workspace-email-feedback-<UUID>. Check Resend/provider logs and admin mailbox before deciding whether any manual resend is appropriate. Do not reset receipt status or issue a fresh ID as a blind recovery.
5. No automatic operator inbox monitor or support SLA is introduced by this change. Reports are operational support records subject to existing retention/deletion handling; do not expose the table in a public dashboard.

## Remaining scope
- Second candidate adds read-only Due next using existing task records. Loads owner-pinned pages before sorting, hides incomplete lists, puts overdue/earliest dates first and undated tasks last. Separate to-do storage is not introduced. Unit, browser and build checks passed.
- Full HoneyBook feature superiority is not established by this UI change.

## Follow-up QA fixes and evidence (06:50 UTC)
- Corrected inbound support contacts in workspace navigation, account-deletion error/settings, security reporting, homepage, template Help and Terms contact to the monitored admin mailbox. `node scripts/test-support-contacts.cjs` scans the app tree and preserves outbound sender identities. Support knowledge/regression checks passed.
- Folded optional booking-link sharing into a native details/summary disclosure and tightened calendar-page-only header/toolbar spacing. Existing copy guards remain intact; no shared global layout rules changed.
- All four calendar screenshots visually inspected; feedback screenshots inspected at narrow and desktop widths. Text, markers, task ordering and controls are readable without clipped content.
- Desktop fixture calendar card starts around 334px from document top (live baseline screenshot was about 630px at a different width/account state, so not a controlled speed/quality comparison).
- **Unfinished mobile priority:** grid still starts around 1446px at 320px width and 1307px at 390px width because introductory/actions/filter controls stack. Collapse or simplify secondary controls in a later verified slice. Current changes do not establish comparative superiority.
- Local evidence: `artifacts/calendar-day-browser/{calendar-320.png,calendar-390.png,calendar-768.png,calendar-1440.png,result.json}`, `artifacts/calendar-share-browser/{copied-*.png,manual-*.png,result.json}`, `artifacts/feedback-browser/{feedback-*.png,result.json}`.
- Build/typecheck logs: `artifacts/overnight-web-qa/overnight-web-build-contacts.log` and `artifacts/overnight-web-qa/overnight-web-typecheck-final.log`. The local QA server/browser processes are stopped when this lane completes.
- Risky-copy scan found no new risky claims; template hits are existing sanitizer match patterns, not rendered promises.
