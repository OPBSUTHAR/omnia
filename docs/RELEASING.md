# Releasing Omnia

Omnia is released from a version tag. The tag drives three things at once: the signed
Android APK, the public update feed and the web deployment. Installed apps discover the
release through the feed and show the in-app update dialog.

## One-time setup

These steps are already done for `OPBSUTHAR/omnia`; keep them documented for recovery.

### 1. Keystore

```powershell
New-Item -ItemType Directory -Force D:\vscode\.omnia-secrets | Out-Null
& "C:\Program Files\Java\jdk-25\bin\keytool.exe" -genkeypair -v `
  -storetype PKCS12 `
  -keystore D:\vscode\.omnia-secrets\omnia-release.keystore `
  -alias omnia `
  -keyalg RSA -keysize 2048 -validity 10000 `
  -storepass "<password>" -keypass "<password>" `
  -dname "CN=Omprakash Suthar, OU=Omnia, O=OPBSUTHAR, C=IN"
```

Back this file up somewhere outside the repository. If it is lost, existing installs
cannot receive another update — users must uninstall and reinstall.

### 2. Repository secrets

```powershell
$bytes = [IO.File]::ReadAllBytes('D:\vscode\.omnia-secrets\omnia-release.keystore')
[Convert]::ToBase64String($bytes) | Set-Content D:\vscode\.omnia-secrets\keystore.b64
gh secret set ANDROID_KEYSTORE_BASE64 --repo OPBSUTHAR/omnia --body-file D:\vscode\.omnia-secrets\keystore.b64
gh secret set ANDROID_KEYSTORE_PASSWORD --repo OPBSUTHAR/omnia --body "<password>"
gh secret set ANDROID_KEY_ALIAS --repo OPBSUTHAR/omnia --body "omnia"
gh secret set ANDROID_KEY_PASSWORD --repo OPBSUTHAR/omnia --body "<password>"
```

### 3. GitHub Pages

Repository → **Settings → Pages → Build and deployment → Source: GitHub Actions**.
The first push to `main` deploys `https://opbsuthar.github.io/omnia/`.

## Cutting a release

1. Start from a clean `main` with CI green.
2. Bump the version and write notes:

   ```bash
   npm run release:patch -- "What changed for users" "Second note"
   # or release:minor / release:major
   ```

   This updates `package.json`, `app.json` (`version`, Android `versionCode`, iOS
   `buildNumber`), writes `release-notes/vX.Y.Z.json` and prepends `CHANGELOG.md`.

3. Review the generated files:

   ```bash
   git diff
   ```

4. Commit and tag:

   ```bash
   git add -A
   git commit -m "release: v1.2.3"
   git tag v1.2.3
   git push origin main --tags
   ```

5. Watch the runs:

   ```bash
   gh run list --repo OPBSUTHAR/omnia
   gh run watch --repo OPBSUTHAR/omnia
   ```

6. Wait for `android-release` to finish. It publishes
   `https://github.com/OPBSUTHAR/omnia/releases/tag/v1.2.3` with `omnia.apk`, then
   commits the refreshed `public/updates/latest.json`.

7. Verify:

   ```bash
   curl https://raw.githubusercontent.com/OPBSUTHAR/omnia/main/public/updates/latest.json
   ```

8. Open an installed copy of the previous version. Within about four minutes (or
   immediately via **Settings → Check for updates**) the update dialog should appear
   with the new notes and a download button.

## What the Android workflow does

`.github/workflows/android-release.yml` runs on `push` of tags matching `v*`:

1. checks out the tag with full history,
2. installs Node 22 dependencies with `npm ci`,
3. restores the keystore from `ANDROID_KEYSTORE_BASE64` into the runner temp directory,
4. runs `npx expo prebuild --platform android --no-install`,
5. runs `node scripts/android-signing.mjs` to point the release build type at that
   keystore and the password environment variables,
6. runs `./gradlew assembleRelease` and copies the APK to `omnia.apk`,
7. creates the GitHub Release using the notes from `release-notes/v<tag>.json`,
8. runs `node scripts/write-feed.mjs <tag>` and commits the feed to `main`.

Because the feed commit lands only after the APK exists, users never see an update
prompt that points at a missing download.

## Manual fallback

If Actions is unavailable, build locally with the Android SDK and Java 17:

```bash
npx expo prebuild --platform android
# restore the keystore, then:
node scripts/android-signing.mjs
cd android && ./gradlew assembleRelease
```

Upload `android/app/build/outputs/apk/release/app-release.apk` to a GitHub Release named
`vX.Y.Z`, then run `node scripts/write-feed.mjs X.Y.Z` and commit the feed.

## Rollback

- **Bad feed value:** edit `public/updates/latest.json` back to the previous version and
  push. Apps that already updated stay updated; apps that have not will stop prompting.
- **Bad APK:** delete the release asset or mark the release as a draft, then publish a
  fixed patch version. Never reuse a version number or versionCode.
- **Bad web deploy:** re-run the `deploy-web` workflow from the last good commit.

## Version rules

- `version` is semantic: `major.minor.patch`.
- `android.versionCode` must increase by exactly one per release; the version script
  handles it.
- Tags always match `v<version>` and the value in `app.json`.
- Pre-release suffixes (`1.2.0-beta.1`) are allowed for testing but the feed should
  normally point at a stable build.
