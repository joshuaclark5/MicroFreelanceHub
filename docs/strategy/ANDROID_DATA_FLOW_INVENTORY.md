# Android data-flow inventory for Play review

Prepared 2026-11-25 from the 0.1.6 candidate source. This is evidence for completing the store form, NOT a submitted Data Safety declaration or a claim of full policy acceptance.

| Surface | Observed behavior | Evidence / remaining review |
| --- | --- | --- |
| Email/password sign-in | Credentials passed to Supabase Auth; password field cleared after successful sign-in | mobile/App.tsx; assess authentication/provider retention separately |
| Google sign-in | External authorization flow with PKCE; user identity returned through Supabase Auth | mobile/src/googleSignIn.ts; Google consent and provider data handling remain relevant |
| Saved sign-in | Session stored through Expo SecureStore; no plaintext fallback on secure-store failure | mobile/src/nativeSessionStorage.ts and encryptedSessionStorage.ts; Android backup exclusion rules need final artifact check |
| Project display | Reads current owner's active project IDs, names and status; bounded to 200 displayed records | mobile/src/workflow.ts; this is account-linked business data |
| Time history | Reads latest 20 completed entries: project ID, note, duration and start time | workflow.ts; free-text notes may contain personal/customer information |
| Manual time save | Sends owner identity, operation ID, project, note, times and nonbillable accounting fields to Supabase RPC | workspace_time_mutate; no invoice or charge created by native capture |
| Draft/retry state | Kept in component memory; not a durable offline queue | App.tsx; quitting/signing out can lose retry identifier, disclosed in UI |
| Website shortcuts | Open external browser for calendar, booking, clients, invoices, signup and account recovery | Website data flows and digital-subscription purchase links require separate Play-policy review |
| Deletion request action | Opens user's email application with recipient/subject; user chooses whether to send | Does not prove mailbox delivery, fulfillment or automatic deletion; support route remains unresolved |

## Source permissions and dependencies

Source Android manifest requests INTERNET and VIBRATE; explicitly removes external-storage read/write, overlay and microphone permissions. Final merged APK permissions must be checked, not inferred from this manifest alone. No location/camera/contact access or analytics SDK calls were found in the bounded app-owned source scan. That is NOT proof that no SDK/provider collects diagnostics, IP addresses or other data; release dependencies and provider behavior require review before declaring that in Play.

Expo update metadata is disabled in the current native manifest. SecureStore is configured with device-only/unlocked semantics; inspect the final Android backup XML and package before asserting device backup treatment. HTTPS endpoints are used in the observed application flows, but this inventory is not a transport audit of every dependency.

## Do not submit prematurely

Resolve actual support receiving/fulfillment, verify privacy/request web resource, review downstream SaaS payment links, confirm applicable SDK/provider data classifications and retention, and complete real-device/reviewer access checks. Do not answer 'no data collected' merely because there is no native analytics code. Do not describe physical-service invoice payments as MFH digital subscription purchases. Neither direct APK availability nor this document establishes Play closed-test opt-ins or production approval.
