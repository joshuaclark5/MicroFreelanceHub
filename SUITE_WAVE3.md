# Wave 3 local candidate

Continues full-suite scope from5229804 without production writes. This wave is not category completion.

## User-facing refinement
Shared original-brand navigation, sage editorial cards, scannable form sections and primary actions replace isolated developer-form presentation for time/invoices/scheduling. Ordinary decimal prices convert exactly to integer minor units using BigInt and explicit USD/EUR/GBP/CAD/AUD/JPY/KWD exponents. Excess precision rejected rather than rounded. Hours/minutes convert to exact seconds; editing preserves a saved timer remainder. Start inputs display browser-local time with timezone and DST policy, while unchanged edits preserve the stored UTC instant including a repeated-hour occurrence. Timesheet grouping remains UTC and is explained. Allowances are not funded retainers; no email/charge actions added.

## Verification
Run node scripts/verify-suite-wave3.cjs after integration; actual handler fixtures and file-backed PGlite remain distinct from browser fixtures and actual Supabase. Production preview browser scripts require QA_BASE_URL and intercepted fictional APIs. Test builds may use NEXT_FONT_GOOGLE_MOCKED_RESPONSES pointing to external wave3/font-fixture.cjs to reuse unchanged existing Inter font assets when Google font fetch hangs. No source dependency/config or font identity change. This build is not deployable.

## Retained scope
Full CRM and resource planning, actual team membership owner/admin/member invite acceptance/revoke/tenant tests, authenticated multi-backend concurrency, complete calendar/accounting OAuth/provider integrations and genuine iOS/Android/offline/push/store distribution remain queued or blocked by their real prerequisites. No adapter/PWA/category/superiority completion claim. Existing pending billing protections and production release gates remain.
