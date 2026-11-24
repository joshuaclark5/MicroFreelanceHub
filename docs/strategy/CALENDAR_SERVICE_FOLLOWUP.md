# Calendar and service follow-up - Joshua's November 24 feedback

## Explicit requested behavior
- Buttons must make saving, success and failure unmistakable, not merely change grey/green.
- A business such as a salon needs a list of services that customers choose from, using shared working hours.
- Time off should support an inclusive multi-day range.
- A calendar-focused page should show working/available hours and bookings for the selected day, with links to the relevant management/edit flow.

## Current truth
- An availability rule combines an event title, timezone, hours, duration, buffers, recurrence and limits. A public link currently publishes one rule and one intake; there is no multi-service chooser.
- The embedded calendar shows saved MFH bookings, not a verified list of free hours. It links to booking records. Existing availability/intake history is immutable; changing it currently requires a new version/rule, not editing old appointment times.
- This candidate adds inclusive day-off ranges to availability drafts using the existing excludedDates schema. It does not yet create an owner-wide holiday switch, change existing saved rules or cancel appointments.

## Next coherent implementation lanes (still pending)
1. Calendar-focused route with selected-day bookings and clearly labeled working-hour windows. Do not call a window free/bookable unless the same server constraints used for booking, including connected-calendar freshness, have been checked. Provide deep links to the correct rule or booking, with account checks and lookup support beyond the latest500 list.
2. Versioned availability management: replace a saved rule atomically while preserving old booking references/times; update the intended public/service associations explicitly. UI must not pretend an immutable historical record is edited in place.
3. Owner-wide time-off ranges: show affected existing bookings without canceling or messaging them; block new bookings consistently across every selected service. Define the business timezone and inclusive date boundaries, and test DST plus concurrent booking.
4. Services separate from business hours: names and durations/buffers, active service list, service-to-hours associations, a customer service picker and booking-time service snapshots. Existing single-rule links retain their current behavior until the owner opts into the new mode. Service-specific durations must use the server overlap/cap/notice/horizon engine, not a frontend-only slot calculator.

## Verification and boundaries
Keep production records and links unchanged until each owner explicitly changes setup. No customer messages, live charges or silent appointment movement. Use synthetic staging fixtures, disable their links/rules and cancel their test bookings afterward; retain immutable synthetic history honestly. New schema work needs fresh recovery/rehearsal and independent hosted readback. Review both phone and desktop customer flows. Monthly/yearly recurrence and the capable on-site AI assistant remain separate unfinished mission items.
