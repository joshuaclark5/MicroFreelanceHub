# Email and pipeline upgrade — 2026-11-23

## Approved direction
Joshua requested improvements to the customer/project workbench and polished emails inspired by his HoneyBook welcome-email screenshots. Preserve MicroFreelanceHub's identity, working tools, login/logout and existing public URLs. No personal/street address in email designs. This is a first implementation slice, not feature parity with HoneyBook.

## Implemented surfaces
- Project pipeline: actual stage columns, stage counts, customer links, task completion counts, next due task, project-specific tasks/agreements links and existing version-checked edit form. List view remains available for deletion and full notes. Empty stages and first-account setup are explicit. Missing loaded stages retain their projects in an unavailable-stage column.
- Search: project customer and stage names supplement existing project text search.
- Workspace email transport: escaped HTML brand layout alongside unchanged plain text. Existing consent, recipient selection, idempotency and failure semantics remain intact. No campaigns or live test messages sent.
- Welcome function source: personalized branded design, numbered setup links, mobile-first table layout and plain-text alternative. Removed unsupported pricing/tax claims. Provider rejection no longer returns successful completion.
- Preference persisted in PROJECT_CONTEXT.md and the agent's long-term memory.

## Deliberate limits
HoneyBook authenticated editors were not inspected. Screenshot evidence covers their email design; earlier official documentation supports capability comparisons only.

The welcome function is not called by current onboarding. Updating its source does not enable automatic delivery; authenticated recipient binding, deduplication and delivery integration must precede activation. No promotional sequence is enabled. Marketing needs compliant sender-address and unsubscribe configuration without exposing Joshua's personal address. No unlaunched app-store badges.

Document/invoice editor redesign, custom pipeline views and automation are not included. No database migrations, billing changes or public SEO changes.

## Verification
- TypeScript check passed.
- Existing email-worker suite: six groups passed with fictional provider/database transport.
- Email design test checks HTML escaping, plain-text content and supported setup links.
- Final production build passed after restoring original Unicode labels. Use explicit UTF-8 when editing source on Windows; never run a rebuild against the same `.next` directory used by an active acceptance-test server.
- Targeted board/email browser tests passed with fictional API fixtures at 320, 390 and 1440 pixels; mobile and desktop screenshots visually inspected.
- Broader workspace regression passed across 320, 390, 768 and 1440: create/edit/delete, task completion, keyboard use, failed/uncertain saves, expired sessions, owner mismatch, stale-edit recovery and 1005+ records. Loading fixtures now hold their response until the loading-state capture completes instead of racing a timer.
- Browser email previews are not Gmail/Outlook delivery evidence.
