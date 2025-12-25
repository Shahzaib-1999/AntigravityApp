Quick guide — native Google Sign-In (Android) for this app

Goal: show native account chooser inside the app (not open Chrome). The app currently uses a browser OAuth redirect; the native experience requires using a native Google sign-in plugin and exchanging the returned ID token with Supabase.

Recommended plugin: @codetrix-studio/capacitor-google-auth (works well on Android and iOS).

Steps (Android)

1) Install plugin

  npm install @codetrix-studio/capacitor-google-auth
  npx cap sync android

2) Configure Google credentials

  - Go to Google Cloud Console -> APIs & Services -> Credentials
  - Create an "OAuth 2.0 Client ID" for Android:
    - Package name: match Android appId (e.g. com.base44.app)
    - SHA-1 fingerprint: add your app's SHA-1 (get from `keytool` or Gradle signing report)
  - (Optional but recommended) Create a Web OAuth client if you need server-side verification

3) Add config files (required)

  - Download `google-services.json` from the Google Cloud Console (APIs & Services → Credentials) for the Android OAuth client you created and place it into `android/app/`.
  - Ensure your Android OAuth client has the **package name** (appId, e.g. `com.base44.app`) and the **SHA-1** fingerprint of your signing key. Without this, the native SDK will often fall back to a web flow.
  - Create a **Web OAuth client** too (if you plan to request ID tokens). Note the Web client `client_id` — some plugin setups require this value to be present in your configuration.

4) Rebuild and test (debugging checklist)

  - Run `npx cap sync android` then `npx cap open android` and build in Android Studio.
  - Install/run on a device with Google Play services (emulator with Google Play is okay).
  - Watch logcat for DEBUG logs. The app now logs detailed messages from the sign-in handler like:

      [GoogleSignIn] isNative: true
      [GoogleSignIn] calling GoogleAuth.signIn()
      [GoogleSignIn] signIn() returned: { ... }

  - If you see "No idToken returned" in a toast or the console, verify:
    - `google-services.json` is present in `android/app/`
    - The Android OAuth client includes your package name and SHA-1
    - You have a Web OAuth client if you need ID tokens (and its client_id is correctly configured)

  - If the sign-in opens Chrome instead of showing the native chooser, it usually means the plugin is not finding a native configuration and is falling back to a web-based OAuth flow. Adding the proper `google-services.json` and client cert should fix it.

  npx cap sync
  npx cap open android
  (rebuild in Android Studio)

5) Code changes (already applied in `src/pages/MyLogin.jsx`, `src/components/RegisterModal.jsx`, and `src/pages/MySignup.jsx`)

  - On native platforms we call `GoogleAuth.signIn()`.
  - We then extract `idToken` and call `supabase.auth.signInWithIdToken({ provider: 'google', token: idToken })`.
  - On web we still use the existing `supabase.auth.signInWithOAuth` fallback.

6) Supabase

  - Make sure Google provider is ENABLED in your Supabase project's Authentication -> Providers.
  - You don't need special redirect URLs for `signInWithIdToken`, but ensure your Google client is configured properly (package name / SHA-1).

Notes & troubleshooting

- The native account picker is provided by the Google SDK and will be displayed automatically by the plugin.
- If sign-in fails with "no ID token", confirm the Google client configuration and that you requested an ID token in the plugin (default normally returns it).
- If you want to support sign-out or linking identities, implement `GoogleAuth.signOut()` and Supabase's `linkIdentity()` / `unlinkIdentity()` as needed.

Links

- @codetrix-studio/capacitor-google-auth: https://github.com/CodetrixStudio/capacitor-google-auth
- Supabase docs: signInWithIdToken (auth.signInWithIdToken)

If you want, I can add step-by-step Android manifest / build edits for this project and a short test routine to verify the native picker works on a device/emulator.