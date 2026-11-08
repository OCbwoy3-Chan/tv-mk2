# Launch development builds through enabled app icon aliases

Changing the Android app icon disables `MainActivity` and enables an activity
alias. Expo remembers the underlying React activity class and tries to launch it
explicitly, which fails while that component is disabled.

Keep the explicit activity when Android can resolve it, preserving Expo's
support for embedded React activities. Otherwise use the package's enabled
launcher activity. Existing intent extras, deep links, flags, and errors remain
handled by Expo.

## Regression check

With Mu Light selected, confirm `MainActivity` is disabled and the package's
launcher resolves to `MainActivitymu_light`. Open the Metro project from Expo's
development launcher and confirm the app loads through that alias without
re-enabling `MainActivity`. Repeat with the default icon enabled.
