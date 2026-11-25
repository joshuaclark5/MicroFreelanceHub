# Android 0.1.6 candidate

Version 0.1.6 / Android code 7 prepares the signed-in project/time-entry label correction for a new installable candidate. The prior 0.1.5 artifacts remain preserved and do not contain that correction.

Pre-build source validation: mobile TypeScript, mocked Home/Time label regression, session-startup/action/Google helpers, time-save UI lifecycle and Android JS export passed in preceding work. No change to customer data or save/auth behavior is introduced by this version increment.

Build and release gates remain separate: verify the signed APK/AAB version and unchanged signing identity; scan bundled configuration for public-only credentials; install/inspect on the owned test device before claiming device readiness. Current support-address receiving/fulfillment and Play-policy/track acceptance are unresolved. This document does not assert build success, publication or a new tester download.

Package-audit hardening while native build runs: APK badging must match app.json version/code before any success report is written. Known old garbled labels are checked in both UTF-8 and UTF-16LE; the preserved 0.1.5 Hermes bundle contains the bad labels in UTF-16LE, not UTF-8. The version guard was exercised against the still-old build output and correctly rejected it without producing a 0.1.6 report. These are audit checks, not a successful 0.1.6 package verification.
