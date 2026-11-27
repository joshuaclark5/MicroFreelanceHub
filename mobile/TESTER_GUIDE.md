# Android 0.1.5 early tester candidate

This is a deliberately narrow first Android build, not full website parity.

## Included
- Privacy policy and an explicit account-deletion request action. It opens an email draft only; no email is sent automatically.
- Dark status-bar icons on the light app background.
- Sign in to the existing MicroFreelanceHub account, including the Google system-browser flow.
- Encrypted session storage and a visible recovery screen if storage cannot be restored.
- Home overview of loaded projects and recent time entries.
- Review and save nonbillable time; no invoice or charge is created.
- Calendar and customer booking-link shortcuts open the existing website. Website sign-in is separate.

## Important limitations
- Calendar, invoices, agreements and clients are website links, not native editors.
- Unsent time drafts and uncertain-save retry IDs are not durable. Keep the app open when a save is uncertain and retry the same entry there. Before re-entering after a restart, check the original account for an existing entry.
- Not offline-ready. No push notifications, native calendar editing or AI assistant.
- No promise of a five-star rating or public Play availability.
- Direct APK installation does not count toward Google Play closed-testing enrollment. The Play opt-in link will be separate once that track is actually available.
- If installed outside Google Play, the upload-key signature may differ from the later Play App Signing certificate. Migration may require uninstalling the early APK; resolve uncertain saves first.

## Tester checks
1. Confirm the app opens without a crash and text is readable at your phone's text size.
2. Use your existing account. Check Google sign-in and return from the browser.
3. Confirm only your own projects and entries appear. Report incorrect account data immediately and stop testing.
4. Close and reopen after a successful login; confirm the same account is restored.
5. Open Calendar and Customer booking link. Configure/share only your own booking link on the website.
6. If trying time capture, use an unmistakable test description and your own project. Confirm a saved entry appears once. Do not repeatedly resubmit an uncertain entry.
7. Sign out, reopen and confirm account data is no longer visible.

Package: com.microfreelancehub.mobile; version 0.1.5; version code 6; Android 7 or newer; arm64 and x86_64.

Build, package verification, native screenshots and store status must be attached separately. This document is not evidence that those checks passed.
