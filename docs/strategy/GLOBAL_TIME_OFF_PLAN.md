# Owner-wide time off: database groundwork (2026-11-24)

## Status
Local database proof only. **Not a production migration or shipped feature.** The app remains at PR35. The executable reference files are `scripts/workspace-review/global-time-off-prototype.sql` and `scripts/test-global-time-off-prototype.cjs`.

The runner creates a disposable clone of `staging_recurrence` inside the existing Docker container, asserts network mode `none` and no port bindings, and refuses to install the prototype outside a `time_off_prototype_<digits>` database. SQL installation is transactional. All accounts and appointments created by the runner are fictional. No hosted requests are made.

## Verified facts
- Private `workspace_scheduling_mutate`, public submit and public slot-window functions already share `pg_advisory_xact_lock(hashtextextended(owner_id::text,73118))`.
- The prototype creates a time-off interval under that same lock and adds an insertion guard to the actual restored bookings table. Both existing private and public submission functions reject new overlaps.
- A five-day range is inclusive in one explicitly chosen business timezone and represented as a half-open UTC interval. Appointment **buffers** are included in conflict checks; exact non-overlapping endpoints remain allowed.
- Existing confirmed appointments remain confirmed. Retrying an already-confirmed private booking operation returns the prior record rather than creating another appointment or failing because time off was added later.
- Separate PostgreSQL connections proved both lock orderings, with `pg_blocking_pids` confirming actual waiting: time off first rejects the waiting booking; booking first is preserved and counted when time off is created.
- Reference boundary tests cover New York spring/fall days and five-day ranges, Havana's repeated midnight, Sao Paulo's midnight gap, Lord Howe half-hour shifts, Troll two-hour shifts, Kathmandu's quarter-hour offset and Apia's skipped civil day. An empty skipped-day range is rejected. Anonymous prototype creation is rejected.

## Deliberately exposed gap
The test confirms that current public slot previews still offer times inside the prototype closure. Submission protection alone would create a confusing customer experience. **Do not deploy this prototype guard alone.** Both `public_booking_service` preview mode and `public_booking_window` must omit blocked intervals using the same buffered-overlap rule, while retaining their owner lock, privacy boundaries, paging cursor, calendar freshness and idempotency behavior.

## Production design and acceptance gates
1. Add a real owner-only table with immutable range/timezone boundaries, versioned activation/removal, explicit RLS/ACL and a reviewed owner/time-range index. A range timezone applies consistently across every current/future service; do not infer it silently from one rule.
2. Implement a closed authenticated API/RPC with expected actor, operation ID and version checks. Keep idempotent receipts and recoverable unknown-result retries. The prototype's typed function does not implement this lifecycle and has no browser-facing grants.
3. Owner preview must list/count affected existing appointments without canceling, moving or messaging them. Revalidate under the owner lock at save; require renewed review if the affected set changed. The primitive prototype reports the committed existing-booking count, not this complete UX.
4. Apply the overlap predicate to both public slot-list paths and authoritative booking saves. Preserve the owner-before-calendar lock order. Review any future reactivation/reschedule UPDATE path too; the prototype only guards INSERT because current saved appointment times are immutable.
5. Add clear owner controls for inclusive dates, business timezone, save/retry feedback, affected bookings and removing time off. Calendar working-hour patterns must distinguish time off without claiming verified free slots. Public responses must not expose private time-off labels, owner IDs or affected bookings.
6. Replace or optimize the deliberately exhaustive second-resolution day-boundary reference only after parity tests. Keep an explicit behavior for skipped civil dates and timezone rule updates; benchmark the final implementation before claiming production performance.
7. Before release: fresh recovery/restore rehearsal, immutable new migration, source-baseline guards, independent function/ACL/history readback, staging application tests and public/private concurrency tests. Never edit the already-applied PR31 migrations. Verify legacy behavior with no time-off rows.
8. Rollout/rollback must preserve already-created closures. Disabling creation is not permission to silently reopen saved time off. Do not remove guards/slot filtering while active closures exist.

## Evidence
Latest authoritative result: `artifacts/global-time-off-prototype/result.json` and `artifacts/global-time-off-prototype-final.log`. The first runner attempt timed out because its open psql input lacked a terminating newline; fixed and re-proved. Retained disposable databases are local evidence, not hosted fixtures. No application build/release is claimed for this SQL/test-only groundwork.
