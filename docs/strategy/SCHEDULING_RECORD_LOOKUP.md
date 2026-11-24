## Exact scheduling-record lookup

The calendar-only view currently rejects truncated record lists. Removing that restriction safely requires date-scoped loading AND management links that can resolve older records.

This change adds authenticated, owner-filtered GET lookups for one booking or availability rule. A linked booking also loads its original intake labels when outside the recent list. Default list limits remain intact; focused records are deduplicated. Missing/other-account records return the same unavailable response. Invalid or ambiguous identifiers are rejected before table reads. No writes, messages or schema changes are introduced.

The scheduling page derives the lookup from its record anchor, handles same-page hash navigation, scrolls after records load, and ignores superseded responses. Failed refreshes hide stale records while preserving form drafts.

Date-scoped calendar queries remain unfinished. This is groundwork, not a claim that the large-account calendar limit or service catalog is solved.
