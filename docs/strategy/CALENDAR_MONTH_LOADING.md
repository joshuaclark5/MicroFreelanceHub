# Calendar month loading

## Scope
The calendar-only route requests `calendarMonth=YYYY-MM`, rather than the newest 500 records across all history. The authenticated API loads active availability rules and bookings starting within a conservative UTC envelope (two days before the month's first day through two days after the next month's first day). This covers every display timezone without treating local midnight as a fixed UTC offset. The calendar groups those instants in the selected display timezone.

Intake history is not queried for the month view. Exact booking/rule management links continue to use the independent account-checked lookups released in PR34. Existing default scheduling lists and mutations are unchanged.

## Limits and UI
The supported month range is 1900-01 through 2199-12. A month picker permits direct jumps. Search, canceled filtering and display timezone survive refreshes and month navigation. Old content is hidden while a request is pending; the latest requested month wins. Wrong-month responses, changed accounts, errors and truncated results cannot appear as an empty complete calendar.

The query remains bounded to 500 bookings in its timezone envelope and 500 active rules. Exceeding either limit is explicit and hides the incomplete view. This removes the all-history/intake-history ceiling for ordinary months, not every possible large-account limit. Dense-month pagination and an owner/start-time query-plan/index review remain follow-up. No performance benchmark is claimed.

Working hours remain pattern previews, not verified free slots. No schema changes, notifications, appointment edits or billing actions are part of this release.
