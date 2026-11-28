# Explicit recipient mailbox verification

Status: implemented, staging verified; production hold remains until the bounded release is verified.

Production email auto-confirm is not evidence of mailbox ownership. The earlier hold (20261128050000, already applied) remains a safe legacy entry point. New migration 20261128051000 adds service-only challenge records and session-aware read/signing guards; it does not update existing documents or signatures.

The user requests a 128-bit random code at the agreement page. Only its SHA-256 hash is stored; the code is sent by the existing transactional email provider, not returned to the browser or put in a URL. The server validates the exact access token before extracting actor/session. Email destination and version come from the authoritative document. Both viewing and accepting require proof for the same actor, session, recipient address and document version. Codes expire in 15 minutes, allow five verification attempts and are one-use. Requests are serialized and limited to three per actor/document per hour. Access expires in 24 hours; changed version/address or canceled document denies access. Owner access remains unchanged. A fresh login requires a new code.

## Evidence

- Actual migrations in isolated PGlite: wrong actor/session, auto-confirm-only read denial, replay/expiry/attempt/rate limits, version/address revocation, immutable terms and single acceptance receipt.
- Actual transpiled handler/session helper with controlled doubles: exact-token provider validation, origin and auth checks, caller identity ignored, only hash persisted, uncertain mail/failed verification fail closed.
- Staging migration transaction rollback rehearsal and existing document/acceptance fingerprints unchanged (61 existing documents).
- Local production build against isolated staging: normal recipient login; email request accepted by actual Resend provider; code received in controlled Gmail mailbox (message 1a221a8c8f3d0bf3); wrong code rejected; actual code grants private review; another real session of the SAME account remains denied.
- Recipient and owner signed the synthetic agreement through actual server actions at 390px. Same version/hash, correct actors and timestamps. 320/390/1440 layout checks passed. New signed synthetic evidence retained privately; original signed fixture unchanged.
- Initial browser assertion timed out on an overly exact scope-text locator after successful verification. Recovered the same fixture/session; no second email, code or agreement was created.
- First build and independent types passed. Copy subsequently corrected to disclose free sign-in plus recipient verification; final build passed (session82042 exit0), and corrected copy plus signed-record reload passed at320/390/1440.

## Release and rollback

Apply reviewed migration once, recording history atomically after read-only fingerprint capture. Keep the old five-argument acceptance function fail closed for client signatures. Confirm exact deployed commit and affected public code; perform controlled live mailbox verification without a real charge or changing customer agreements. Local/staging proof is not production proof.

If the release fails verification, restore owner-only recipient read policies and add the explicit-recipient hold to the new session-aware acceptance entry point. Preserve all challenge/evidence records; do not delete signed history. Revert the app release if required. Do not restore the insecure email-confirmed-only policy.

No real charges, customer payout/subscription modifications, ad publication or spending occurred. Full AD04 closure requires production evidence; broader AD05 provider TEST Connect enrollment remains separately blocked.
