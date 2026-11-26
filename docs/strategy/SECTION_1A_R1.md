# 1a-R1: workspace business-name consistency

## Existing authority, not a new business model

The current solo workspace is owned by the authenticated account (`owner_id=user.id`). It has no global selected-business ID. Selected team workspaces are separate membership-scoped planning contexts and do not select another solo business. This repair does not implement multi-business switching.

Onboarding's existing `/api/workspace-preferences` endpoint saves `auth.user_metadata.mfh_workspace` with business/profession/goal; Overview reads the same preferences. This is the implemented authority for **workspace display/personalization**, not legal identity, billing company or permission. It authenticates `getUser`, enforces origin and expected owner, and confirms the returned owner and preferences. There is no existing synchronization path into `profiles.company_name`.

Settings previously edited a separate `profiles.company_name`; legacy Welcome queried a third `profiles.business_name`, absent in recorded hosted schema and reproduced as a profile-load failure. Automatically promoting either old field, or dual-writing them on setup, would silently reconcile potentially conflicting names. That is not part of this repair.

## Small correction

- Settings and Welcome read the existing owner-checked preferences endpoint through one shared read-only component; identity is checked before and after the read and stale results are discarded on account changes.
- Both use the existing setup editor to change the workspace business name. No new save endpoint, competing store, default profession/goal or implicit onboarding completion is introduced.
- Settings retains and labels any differing historical profile company value; it does not overwrite it. Its personal-name save no longer writes company_name.
- Welcome loads/saves the existing personal `full_name` and completion flag, without requesting/writing the absent business_name column. Business editing uses setup separately; skipping remains possible.
- No migrations, privileged business writes, tenant-ID changes, bulk data rewrites or mobile releases.

## Acceptance boundary

M01-011 remains verified and untouched. M01-001 role-navigation coverage remains incomplete. This repair is not full M01-002 onboarding acceptance or full M01-003 multi-business/canonical-record acceptance. Build, browser fixtures and hosted synthetic-account evidence must be reported separately from release provenance. Existing synthetic credentials are reused privately; no account recreation.
