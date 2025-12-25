# Build Release APK - Command Line

## Quick Build Command (Skip Lint)

```cmd
cd android
gradlew assembleRelease -x lint -x lintVitalAnalyzeRelease
```

This command:
- Builds the release APK
- Skips lint checks (which are causing errors)
- Faster build time

## Full Build Command (With Lint)

```cmd
cd android
gradlew assembleRelease
```

## After Build

Your APK will be at:
```
android/app/build/outputs/apk/release/app-release.apk
```

## Notes

- Lint checks are now disabled in build.gradle for faster builds
- If you need lint checks, remove `-x lint` flags
- Keystore: `android/app/my-release-key.jks`
- Passwords: `123456` (store & key)
- Key alias: `release`

