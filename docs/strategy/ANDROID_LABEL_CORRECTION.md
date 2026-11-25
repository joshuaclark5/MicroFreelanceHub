# Android signed-in label correction

2026-11-25: source audit found malformed UTF-8 text in the selected-project marker and the completed-time date separator. Replaced them with plain `Selected: ` and ` - ` labels. No save, authentication, billing or customer data behavior changed.

Checks:
- Updated mocked React Native Home/Time test includes an existing completed entry and asserts the selected radio label and time separator, plus absence of mojibake.
- New regression fails against the prior committed source and passes against the corrected source.
- Separate mobile TypeScript check passed.
- Existing session-action, session-startup and Google OAuth helper tests passed using mocks. These do not prove real authenticated-device acceptance.

Release state: source correction only. The previously built 0.1.5 APK/AAB do not contain this correction. Android bundle export and future signed build/device verification tracked in the workspace checkpoint. Do not publish old artifacts as containing the fix.
