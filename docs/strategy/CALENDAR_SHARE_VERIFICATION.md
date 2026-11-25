# Calendar booking-link shortcut verification

Adds a calendar action that reads the signed-in owner's existing public booking settings and copies only an enabled, validated link. It does not enable bookings, rotate tokens, send invitations or change availability.

Verification (2026-11-25 UTC):
- Production build passed with established ignored local environment; TypeScript passed separately.
- Browser checks passed at 320, 390 and 1440px using only fictional API responses and a stub clipboard; zero network writes.
- Enabled link, missing/disabled portal, deployment gate, expired sign-in, account mismatch, invalid token, server/network failure and clipboard-denied fallback covered.
- Calendar refresh invalidates outstanding link reads; old responses cannot display or copy a stale link.
- Axe WCAG A/AA checks and horizontal-overflow checks passed; phone/desktop screenshots reviewed.
- No schema, API behavior, public SEO route or metadata changes.

Local evidence: artifacts/calendar-share-build.log, calendar-share-types.log, calendar-share-browser/result.json and screenshots. This is local verification, not production or customer-account acceptance.
