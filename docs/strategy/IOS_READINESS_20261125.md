# iOS readiness audit — 2026-11-25

## Result

The same Expo/React Native source targets iOS and Android. **No signed iOS archive, installable IPA, iPhone/iPad acceptance, or TestFlight release was verified in this audit.** Android 0.1.9/code 10 is internally released according to the preserved Play receipt; older source README distribution statements are stale.

This audit is read-only except for this document. No Apple account enrollment, paid build, credential changes, native prebuild, app submission, backend change, or customer-data mutation occurred. Windows is the current build host. Lack of local signing/EAS files does **not** establish that Joshua lacks an Apple Developer account or access to a Mac.

## Verified local state

| Area | Observed evidence | Remaining requirement |
| --- | --- | --- |
| Shared framework | Expo SDK 54, React Native 0.81.5, React 19.1; `mobile/package.json` | Resolve native dependencies and compile on an appropriate Mac/Xcode or authorized remote macOS builder. |
| Platform declaration | Evaluated `expo config --json --type public` includes `ios` and `android` | Configuration evaluation is not compilation or runtime acceptance. |
| App identity | `ios.bundleIdentifier` is `com.microfreelancehub.mobile`; version `0.1.9`; `supportsTablet: true` | Confirm the intended identifier in the owner's Apple team/App Store Connect. Choose the next unused iOS build number independently of Android versionCode. |
| Local build setup | `npm run ios` runs `expo run:ios`; no local Xcode commands found on Windows; no tracked `ios/` project or `eas.json`; evaluated config has no EAS project binding | A local Mac/Xcode path does not require EAS. A remote EAS path needs verified account/project access, credentials custody, and cost review. No route was claimed available. |
| Google login | `mobile/src/googleSignIn.ts` uses system-browser PKCE, validates trusted origin/exact custom callback, rejects fragment tokens and duplicate codes | Verify iOS browser consent, cancel, return-to-app and process interruption on actual iOS. Review Apple login policy below. |
| Callback | Expo scheme `microfreelancehub`; code callback `microfreelancehub://auth/callback` | Verify installed app registration and backend redirect allowance against the eventual signed iOS build. Existing Android evidence is not an iOS runtime test. |
| Session custody | `nativeSessionStorage.ts` uses SecureStore with app-specific service and `WHEN_UNLOCKED_THIS_DEVICE_ONLY`; no plaintext fallback | Test iOS Keychain access while locked/unlocked, background/foreground, restart, sign-out, reinstall and two-account switching. Keychain/reinstall behavior must not be inferred from Android. |
| Crypto | Expo Crypto supplies secure randomness and SHA-256 for S256 PKCE | Adapter tests pass; verify native iOS implementation in a compiled build. |
| Account deletion | `mobile/App.tsx` opens a `mailto:` draft with truthful delivery/retention language | This is not an in-app deletion lifecycle. Resolve the Apple-specific requirement before App Store readiness claims. |
| Distribution gating | Only `EXPO_PUBLIC_DISTRIBUTION === 'play'` currently suppresses website account/workspace shortcuts | A default iOS export is not an intentional App Store distribution profile. Explicitly define and verify iOS distribution behavior. |
| Billing | No native digital-subscription purchase/restore implementation in current app | Evaluate the actual App Store business model and applicable rules by storefront; invoice payments for client work are a separate category from selling MFH digital features. |
| Privacy/signing metadata | No explicit iOS buildNumber, team, App Store Connect record or signing result established by inspected config | Verify account roles, bundle ID, signing, export compliance, privacy declarations/manifests and store metadata using actual intended binary/network behavior. Missing config fields alone do not prove failed signing. |

## Apple policy findings (official source checked)

Fetched [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) successfully (HTTP 200) on 2026-11-25.

- **4.8 Login Services:** a third-party/social primary login must offer an equivalent login option that limits collection to name/email, permits keeping email private, and does not collect app interactions for advertising without consent, unless a listed exception applies. Current source offers Google and email/password; no Sign in with Apple or verified equivalent is implemented. Email/password alone does not establish the required equivalence. The app is a general freelancer service with Google account creation, so an enterprise-login exception has not been established. Implement and verify an appropriate option, or document an actually applicable exception; do not simply hide a broken provider or invent Apple credentials.
- **5.1.1(v):** apps supporting account creation must offer account deletion within the app. Current email-draft request is not proof of compliance. Design an authenticated, explicit, recoverable deletion/request lifecycle consistent with actual retention and billing semantics; do not automatically delete customer data during development. The account-deletion support article could not be retrieved in this audit (connection resets), so its finer exceptions were not treated as verified.
- **3.1 Payments:** digital app-feature/subscription access requires an intentional store-policy design. No blanket prohibition of all external links or invoice payments is asserted here. Review applicable category/storefront exceptions and current implementation before choosing purchase/management links.

These are App Store readiness findings, not claims that Apple has rejected a submitted build. No submission was made. TestFlight internal/external availability and review gates must be verified in the actual Apple account.

## Safe next implementation steps

1. Add an explicit, reproducible **iOS JavaScript export/readiness check** rather than relying on the default all-platform export. Select intended companion behavior deliberately; do not silently inherit the direct-download website-link mode. Validate required public backend variables without printing them. Export output must be labeled JavaScript/assets, not IPA/TestFlight.
2. Generalize the existing store-companion gating into a deliberate iOS mode if that is the chosen initial product. Include tests that website purchase-path shortcuts are not accidentally reintroduced. This alone does not satisfy login/deletion/store policy.
3. Implement an Apple-compatible login path with real verified backend provider configuration. Preserve existing Google account identity and test account linking; do not create duplicate user workspaces as a shortcut.
4. Implement the authenticated account-deletion lifecycle with confirmation, ownership checks, request status and appropriate retention semantics. An email draft can remain an explicitly labeled support fallback, not the sole claimed deletion implementation.
5. Verify available Apple Developer/App Store Connect account/team, Mac/remote-build access and private signing custody. No new paid enrollment or cloud usage is authorized by this audit.
6. Set explicit iOS build numbering once the actual App Store Connect history is checked. Do not set `ITSAppUsesNonExemptEncryption: false` without assessing the app/dependencies and the actual export-compliance answer; SecureStore and Expo Crypto are present.
7. Compile/archive, inspect the resulting signed package, install/test on iPhone and iPad (tablet support is enabled), then upload for the appropriate TestFlight path. Verify the accepted build and tester availability before saying it can be downloaded.

### Coordinated work in progress

Parent is implementing `scripts/export-ios-readiness.cjs` with an explicit `appstore` distribution mode and an export receipt. The native implementation worker owns the matching app condition and Home fixture coverage. **That script, its receipt and the changed mode are pending at the time of this audit; this document does not claim they passed.** Parent will run any export serially with one Metro worker after the source changes settle because the host has recently had severe RAM pressure. Public anonymous backend configuration may be supplied privately to the export process; no backend mutation or credential printing is needed.

## Lightweight checks completed

- Evaluated Expo public config, printing only selected nonsensitive identity/platform fields: passed.
- `node scripts/test-mobile-google.cjs`: passed mocked trusted-origin, exact callback, S256, cancel and safe failure paths.
- `node scripts/test-mobile-native-crypto.cjs`: passed RFC7636 S256 vector, randomness delegation and unsupported-digest rejection.
- `node scripts/test-mobile-secure-storage.cjs`: passed Unicode/chunk/failure/serialization/corruption/sign-out checks and 48 simulated restart boundaries.
- `node scripts/test-mobile-session-startup.cjs`: passed new/returning account, locked-store, restore-error and pending-restore cases.

These checks exercise shared source/adapters and are **not** iOS native tests. No Metro export, Xcode compile, IPA signing, simulator launch, device test or TestFlight publication was run for this document. No website code changed, so no website production-readiness claim or website build was made.

## Parent verification update ? 2026-11-25 22:08 UTC

This supersedes the earlier pending-mode/export wording. `appstore` and `play` now deliberately select the same companion boundary in `mobile/App.tsx`; actual Home fixtures pass in direct, Play and App Store modes. Native invoice implementation/review fixes are included in the tested shared source.

`node scripts/export-ios-readiness.cjs` **passed**: Expo produced one 2.49 MB iOS Hermes bundle plus assets, with source unchanged throughout the export. Receipt: `artifacts/ios-readiness-receipt.json`; source SHA256 `573b7876ce9d5108f184ebf8060b21d6274bb48605476cdd3308f34a92986f32`. The receipt records an uncommitted candidate based on f466e7a, not the already-released 0.1.9 artifact. Source package version is not a release identifier for this bundle.

The result is **JavaScript/assets only**. No IPA, native compile/archive, Apple signing, iPhone/iPad test, submission or TestFlight availability is established. All Apple account/login/deletion and actual native acceptance gates above remain open. No backend/customer writes or paid services were used.
