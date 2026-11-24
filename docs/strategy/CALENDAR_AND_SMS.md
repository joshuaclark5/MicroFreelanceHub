# Calendar and client messaging

Requested by Joshua, November 23, 2026: evolve toward the connected client workflow of HoneyBook and Square, with polished tools and an initially lower-cost offer. This is a product direction, not authorization for a new subscription or an approved price change.

## Implemented in this iteration

- A month calendar over the existing owner-scoped scheduling records, daily agenda, attendee search, canceled-booking filter, display timezone, and links to existing booking details/forms.
- Signed-out navigation pairs Log in with Create an account, linking new users to workspace setup.
- Existing scheduling mutations, ownership checks, intake consent, conflict checks and retry keys remain unchanged.
- This view is not a calendar-sync implementation: external busy events are not displayed, and the existing 500-record bound remains disclosed.

## SMS delivery: not implemented or enabled

No SMS integration exists in the application at this checkpoint. A saved client phone number is contact information, not messaging consent. No SMS sends, paid provider enrollment, marketing enrollment or pricing changes were performed.

Before enabling delivery:

1. Select a provider, approved sender/registration, supported countries and explicit spend cap. Model carrier fees, message segments and support costs before promising a cheaper plan. Keep SMS usage capped or separately priced rather than promising unlimited texting.
2. Add normalized E.164 customer phone numbers and independently scoped reminder and marketing opt-ins. Store disclosure version, source, time, customer, owner and destination; never precheck consent. Changing a number invalidates its consent. Only customer-originated opt-in or auditable imported evidence qualifies, not an owner assertion alone.
3. Add appointment-linked reminder jobs (for example 24 hours and 2 hours before), respecting customer timezone and quiet hours. Reschedules invalidate earlier jobs; cancellation prevents sending. Recheck appointment version, tenant, destination and consent immediately before dispatch.
4. Implement a durable outbox with unique appointment/version/offset keys, atomic worker claims and provider idempotency/reconciliation. An ambiguous provider response must not create a duplicate text on retry. Record accepted versus delivered versus failed separately.
5. Verify provider webhook signatures and replay protection. STOP must immediately suppress the destination across the applicable sender/account, including queued reminders and campaigns. HELP identifies the business and support contact. Re-subscription requires fresh opt-in.
6. Build campaign drafts, preview/segment counts and explicit recipient review. Exclude anyone without marketing consent or with suppression. Enforce per-owner quotas, quiet hours, rate limits and a global kill switch. Do not infer campaign authorization from storing a phone number.
7. Verify tenant isolation, duplicate requests, retry/unknown outcomes, invalid phones, Unicode/multipart pricing, revoked consent, STOP races, reschedules, daylight-saving transitions and webhook forgery using a provider sandbox before any live send.

## Acceptance boundary

The calendar is a local-booking UX improvement, not HoneyBook feature parity. Authenticated HoneyBook editors have not been inspected; prior supplied screenshots and official documentation are the comparison evidence. SMS delivery remains a separate implementation and configuration dependency, not a working feature.
