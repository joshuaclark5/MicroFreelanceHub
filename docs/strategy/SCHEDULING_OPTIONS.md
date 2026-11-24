# Scheduling option and calendar layout fixes

The availability timezone control stores an IANA identifier, not a fixed UTC offset. Common zones have readable names; modern browsers also supply the full supported timezone list. The existing server validator and localInstants conversion remain authoritative for daylight-saving gaps, repeated times and fractional-hour zones.

Appointment duration, buffer, notice, horizon and daily cap now have labeled preset choices. Empty availability/intake selectors tell the owner which prerequisite to create rather than inventing records.

Calendar date wrapping was caused by workspace-wide button padding and section styles. Calendar-specific selectors now isolate those styles, keep date numerals together and preserve selected-day contrast. Browser-local initial state is set after mount to keep server/client rendering deterministic.

Verify in the full workspace, not only an isolated calendar fixture. Run the scheduling browser suite against a completed Next build with QA_BASE_URL, in UTC and America/New_York. It uses fictional intercepted records and checks Denver availability persistence, UTC conversion, retry handling, account-change guards, accessibility and single-line date numerals at four widths. No customer records are written.
