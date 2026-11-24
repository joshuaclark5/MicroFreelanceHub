# Calendar and account entry acceptance

Scope: November 23, 2026 calendar/signup iteration. Fictional browser fixtures only; no customer changes or email/SMS sends.

## Implemented surfaces

- `/workspace/scheduling`: real saved-booking month grid, selected-day agenda, search, display timezone, canceled filter and detail/form anchors. Existing availability, intake, booking and cancellation forms retained.
- Public/shared account control: separate secondary Log in and primary Create an account. Signup targets `/login?mode=signup&next=/workspace/setup`.
- Homepage desktop and mobile menu use the same signup wording and destination.
- No public route, canonical, sitemap, pricing, database schema or delivery behavior changed.

## Evidence

- TypeScript `npx tsc --noEmit`: passed independently (Next configuration skips type checking).
- Production build through the existing private-environment build wrapper: passed. Configuration values were not copied into the repository.
- `scripts/test-calendar-browser.cjs`: real component with fictional data at 320, 390, 768 and 1440. Month navigation, search, canceled filter, midnight timezone boundary, detail anchor and accessibility checks passed. Screenshots inspected at 320 and 1440; no horizontal overflow.
- `scripts/test-workspace-scheduling-browser.cjs`: production-build fixture; all four widths passed create availability, publish intake, create booking, uncertain retry using the same operation key, cancel, draft preservation and account-change blocking. Accessibility scans passed.
- Calendar browser initialization occurs only after the client fetch returns data; the initial server/client scheduling render has no calendar or date defaults.
- Local evidence folders: `artifacts/calendar`, `C:/Users/joshu/calendar-scheduling-evidence`, `C:/Users/joshu/calendar-navigation-evidence`. Do not interpret fixture results as real-account or production interaction proof.

## Deliberate boundaries

- No external calendar events in this view; existing API truncation warning retained.
- SMS provider integration and delivery are not implemented. See CALENDAR_AND_SMS.md for implementation requirements and the spend/configuration dependency.
- HoneyBook signed-in calendar/editor access remains unverified. This is our design improvement, not a claim that their exact behavior was inspected or surpassed.
- Production release verification is a separate step from these local acceptance results.
