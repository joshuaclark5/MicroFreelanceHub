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
- TypeScript: passed feedback/calendar marker candidate. Due-next follow-up final pass pending.
- Build/browser/production: pending. Do not claim live.

## Release prerequisites and operator recovery
1. Apply supabase/migrations/20261125060000_feedback_email.sql to isolated staging; verify grants/claims. Then apply production before web rollout. Existing legacy feedback table/widget unaffected by this migration.
2. Server needs SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL and existing RESEND_API_KEY. Sender support@microfreelancehub.com uses existing domain sending identity; recipient is admin@microfreelancehub.com. Reply-to is optional reporter email, never used as recipient.
3. Run build and fixture browser tests. One authorized synthetic live report must be verified in provider and receiving mailbox by parent; no real email has been sent by this worker.
4. For saved failed/unknown/sending receipts, inspect private feedback_reports by exact report reference. Provider idempotency key is workspace-email-feedback-<UUID>. Check Resend/provider logs and admin mailbox before deciding whether any manual resend is appropriate. Do not reset receipt status or issue a fresh ID as a blind recovery.
5. No automatic operator inbox monitor or support SLA is introduced by this change. Reports are operational support records subject to existing retention/deletion handling; do not expose the table in a public dashboard.

## Remaining scope
- Second candidate adds read-only Due next using existing task records. Loads owner-pinned pages before sorting, hides incomplete lists, puts overdue/earliest dates first and undated tasks last. Separate to-do storage is not introduced. Unit checks passed; browser/build pending.
- Full HoneyBook feature superiority is not established by this UI change.
