# Detailed implementation specification

The master TXT is the exact, immutable attachment supplied by Joshua on November 25, 2026. Do not edit its checkboxes. `sections/` contains contiguous, lossless source slices; together in inventory `sourceParts` order they reproduce the master byte for byte.

Read `sections/G00.txt`, `sections/INDEX.txt`, the active module, its dependency sections, and `sections/M35.txt` before implementing. G00 applies to every module. M35 applies to every release, not just the final module. `sections/COVERAGE_AND_RESEARCH.txt` preserves all 113 earlier inventory mappings and research entry points.

## One tracking system

- Working checkpoint: [OPENCLAW_PROGRESS.md](../../OPENCLAW_PROGRESS.md).
- Requirement inventory: [requirements.json](requirements.json). This is the sole mutable requirement status/checkmark record. Exact original requirement text remains in `text` and `sourceLine`; do not rewrite it.
- Operating authorization: [PROJECT_OPERATING_RULES.md](PROJECT_OPERATING_RULES.md).

All 1,220 original checkboxes begin empty: 33 G00 rules and 1,187 requirements across 35 modules. Empty means unverified, **not missing**. Preserve earlier project evidence and map it to requirements only when it genuinely establishes their acceptance. Do not equate the count with engineering effort or product parity.

Allowed statuses: Unverified, Existing verified, Partial, Missing, Blocked, Deferred, Implemented in staging, Published verified. Only check a requirement after its relevant acceptance succeeds in the named environment. Staging acceptance and publication remain distinct. Keep Partial, Missing, Blocked and Deferred unchecked.

Run `python scripts/verify-checklist.py` to verify attachment integrity, lossless sections, requirement text/IDs, per-module counts, coverage mappings and status invariants. This checks the specification records, not application functionality.
