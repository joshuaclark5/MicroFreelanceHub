# Android 0.1.5 candidate verification

Version 0.1.5, code 6; package com.microfreelancehub.mobile. Not published.

- Mobile TypeScript and mocked Home/startup/account-help tests pass.
- Signed APK/AAB build passed (250 tasks; 39 executed, 211 cached).
- Correct package/version, permission exclusions, release signatures and 16KB ZIP alignment verified. Signing certificate matches 0.1.4 for upgrades.
- Bundled public backend/anon role verified; no detected server/signing credentials. Updated privacy, inline-error and status-bar markers are present in the actual bundle.
- Upgrade installed and launched on Android15 emulator at360dp. Signed-out UI and dark status-bar icons visually inspected.
- Privacy/request controls visually inspected. Email action opens Gmail's first-run setup on this unconfigured emulator; no message was sent. This is not a delivered-request test.
- Temporarily disabled Gmail only on the isolated test emulator, verified the adjacent missing-handler error, then restored Gmail. The error states no request was sent.

APK SHA256: f66b8730d70b233da7f7966084d8f4e0688d6378dbec4c99471ee49388b34149
AAB SHA256: d42181e5356c46afa900ce52b74fac6468679e4d7c8fca58d7b5d54929c758ba

Local evidence: artifacts/android-0.1.5-build-receipt.json, package-verification.json and bundle-audit.json with the same version prefix; android-0.1.5-device, android-0.1.5-account-help and android-0.1.5-account-help-without-mail directories.

Still unverified: support receiving/fulfillment route, successful authenticated sessions and return-session behavior, physical devices, full Play policy and store submission. Public0.1.4 prerelease remains unchanged. Do not publish the new deletion-request path as verified merely because a mail client opens.
