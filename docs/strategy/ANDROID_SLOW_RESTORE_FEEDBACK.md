# Slow sign-in restoration feedback

Source-only follow-up after the verified 0.1.6 candidate. If initial secure-storage/session restoration takes more than 15 seconds, show a polite live message explaining that restoration is still pending, asking the user to check connectivity/device unlock, and clarifying that this screen has not reset the account.

The message is informational: it does not time out or cancel the SDK, clear stored credentials, create another client, assume the person is new, or start an overlapping login attempt. The timer is cleared on success, failure and effect cleanup. Existing error recovery remains unchanged.

Mocked startup-screen regression checks initial loading, delayed notice, failed-storage cleanup and successful retry. TypeScript and Home/Time, save-recovery, and account-help mock tests passed. This is not real offline-device or authenticated-session acceptance. Preserved 0.1.6 APK/AAB do NOT contain this subsequent source change; a later versioned build is required before publication.
