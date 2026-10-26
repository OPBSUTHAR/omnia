# Releasing Omnia

Omnia is released from a version tag. One tag drives the signed Android APK, the Windows
installer, the Linux AppImage, the public update feed, the Vercel deployment and the
GitHub Pages guide. Installed apps discover the release through the feed and show the
in-app update dialog.

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

Desktop builds are currently unsigned. No certificate secret is required.

### 3. Hosting

- **Vercel:** import `OPBSUTHAR/omnia`, framework preset **Other**, build
  `npm run build:web:routes`, output `dist`. `vercel.json` already contains these
  settings.
- **GitHub Pages:** repository → **Settings → Pages → Source: GitHub Actions**. The
  `Deploy docs` workflow publishes `site/`.

## Cutting a release

1. Start from a clean `main` with CI green.
2. Bump the version and write notes:

   ```bash
   npm run release:minor -- "Windows and Linux desktop installers" "Downloads in the app footer"
   # or release:patch / release:major
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
   git commit -m "release: v1.1.0"
   git tag v1.1.0
   git push origin main --tags
   ```

5. Watch the runs:

   ```bash
   gh run list --repo OPBSUTHAR/omnia
   gh run watch --repo OPBSUTHAR/omnia
   ```

6. Wait for `release.yml` (jobs: Android, Windows desktop, Linux desktop, Publish). It
   publishes `https://github.com/OPBSUTHAR/omnia/releases/tag/vX.Y.Z` with:

   - `omnia.apk`
   - `omnia-windows.exe`
   - `omnia-linux.AppImage`

   Then it commits the refreshed `public/updates/latest.json`.

7. Verify downloads:

   ```bash
   curl -I https://github.com/OPBSUTHAR/omnia/releases/latest/download/omnia.apk
   curl -I https://github.com/OPBSUTHAR/omnia/releases/latest/download/omnia-windows.exe
   curl -I https://github.com/OPBSUTHAR/omnia/releases/latest/download/omnia-linux.AppImage
   ```

8. Verify the feed:

   ```bash
   curl https://raw.githubusercontent.com/OPBSUTHAR/omnia/main/public/updates/latest.json
   ```

9. Wait for the Vercel deployment and the `Deploy docs` run triggered by the feed commit.

10. Open an installed copy of the previous version. Within about four minutes (or
    immediately via **Settings → Check for updates**) the update dialog appears with the
    new notes and the installer for that platform.

## What the release workflow does

`.github/workflows/release.yml` runs on `push` of tags matching `v*`:

| Job | Runner | Output |
| --- | --- | --- |
| `android` | Ubuntu | signed `omnia.apk` artifact |
| `desktop` (Windows) | `windows-latest` | `omnia-windows.exe` artifact |
| `desktop` (Linux) | `ubuntu-latest` | `omnia-linux.AppImage` artifact |
| `publish` | Ubuntu | GitHub Release + feed commit |

The Android job:

1. checks out the tag with full history,
2. installs Node 22 dependencies with `npm ci`,
3. restores the keystore from `ANDROID_KEYSTORE_BASE64` into the runner temp directory,
4. runs `npx expo prebuild --platform android --no-install`,
5. runs `node scripts/android-signing.mjs` to point the release build type at that
   keystore and the password environment variables,
6. runs `./gradlew assembleRelease` and copies the APK to `omnia.apk`.

The desktop jobs export the web app, run `scripts/prepare-desktop.mjs`, install the
Electron dependencies and build with electron-builder. The publish job downloads all
three artifacts and attaches them to one release.

Because the feed commit lands only after all installers exist, users never see an update
prompt that points at a missing download.

## Manual fallback

If Actions is unavailable, build the pieces locally.

Android (requires Android SDK + Java 17):

```bash
npx expo prebuild --platform android
# restore the keystore, then:
node scripts/android-signing.mjs
cd android && ./gradlew assembleRelease
```

Windows:

```bash
npm run build:desktop:win
# desktop/release/omnia-windows.exe
```

Linux (run on Linux):

```bash
npm run build:desktop:linux
# desktop/release/omnia-linux.AppImage
```

Upload those files to a GitHub Release named `vX.Y.Z`, then run
`node scripts/write-feed.mjs X.Y.Z` and commit `public/updates/latest.json`.

## Rollback

- **Bad feed value:** edit `public/updates/latest.json` back to the previous version and
  push. Apps that already updated stay updated; apps that have not will stop prompting.
- **Bad binary:** delete the release asset or mark the release as a draft, then publish a
  fixed patch version. Never reuse a version number or Android versionCode.
- **Bad web deploy:** promote the previous deployment in Vercel, or revert the commit and
  let Vercel rebuild.
- **Bad docs deploy:** re-run the `Deploy docs` workflow from the last good commit.

## Version rules

- `version` is semantic: `major.minor.patch`.
- `android.versionCode` must increase by exactly one per release; the version script
  handles it.
- Tags always match `v<version>` and the value in `app.json`.
- Pre-release suffixes (`1.2.0-beta.1`) are allowed for testing but the feed should
  normally point at a stable build.
- The feed version is the installed app's source of truth. Desktop builds read the raw
  GitHub feed, not the copy bundled inside the installer.
