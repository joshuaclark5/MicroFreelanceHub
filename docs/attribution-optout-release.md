# Attribution opt-out repair

Scope: stop new attribution capture/forwarding when DNT/GPC or an explicit auth handoff opt-out is active. Existing first-touch history and financial records are not deleted; local drafts remain intact. No plan/price/access changes.

Client read paths now honor current privacy signals even if prior campaign data or explicit URL overrides exist. Google/email callbacks carry a restrictive opt-out marker. Server callback and checkout independently honor DNT/Sec-GPC and the restrictive marker/body flag. Opted-out checkout omits existing profile attribution from newly created Stripe metadata. A client flag cannot authorize otherwise prohibited tracking.

Focused actual helper/handler tests cover late preference changes, stored/URL inputs, callback persistence/redirect, server header denial, preserved plan/template and historical profiles; Stripe/database adapters are mocked. Required build and local browser verification tracked in the canonical ad-readiness ledger. No real account, email, charge, subscription or ad action is authorized by this test.

Remaining scope: full consent/region review, historical deletion requests, Meta diagnostics and full authenticated production journey are separate gates. Duplicate checkout custody remains open; this PR does not fix it.
