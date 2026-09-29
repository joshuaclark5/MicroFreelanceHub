# Agreement Upgrade Release Gate

Do not publish the application before its database dependencies are verified.

1. Confirm latest origin/main and retain all newer articles and public routes.
2. Use authorized Supabase administration, take a database backup and inspect
   existing sow_documents columns, policies and triggers. Do not use a service
   API key as a substitute for database-admin access.
3. Reconcile pending legacy Stripe checkout sessions. Old sessions lack the new
   agreement metadata; do not silently classify an existing payment as unpaid.
   Historical Paid backfill preserves recorded state, not proof of a charge.
4. Apply migrations in order:
   20260929000000_agreement_payment_receipts.sql and
   20260929000001_balance_aware_reminders.sql.
5. Verify service-role-only receipt RPC access, anonymous/authenticated denial,
   owner draft edits, signature reset, receipt uniqueness and actual column types.
   Confirm pg_net is available for the existing reminder function. Do not run
   the live reminder sweep as a test; it sends customer emails.
6. Rebuild, run independent TypeScript, browser suites and sitemap comparison.
   Inspect canonicals, robots and representative rendered SEO content.
7. Deploy the saved release commit, verify deployment success, then public smoke
   test homepage, template entry, guided editor, signin and client portal without
   creating live charges, signatures or customer emails.
8. Record deployment URL, revision, timestamp and observed results. Monitor real
   activation and payment events; no guaranteed conversion or indexing claims.

## Boundaries

Prices and plan entitlements are unchanged. Recurring invoice cycles, refunds
and disputes need their own reconciled lifecycle before claiming a comprehensive
payment ledger. Current tests prove initial checkout receipts and partial balance
handling, not all Stripe lifecycle events.

## Rollback

Retain a database backup and previous release revision. Do not blindly redeploy
the old vulnerable mark-paid endpoint or remove receipt history. If verification
fails, hold the application deployment and investigate; use a reviewed payment
maintenance gate rather than exposing unverified payment writes.
