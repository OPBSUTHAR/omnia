# Architecture

Omnia is one Expo Router codebase rendered three ways:

1. **Android** — a native React Native app packaged as a signed APK.
2. **Web** — the same routes exported as a static React site and served by Vercel.
3. **Desktop** — that web export packaged inside Electron for Windows and Linux.

There is no backend. Every screen is client-rendered and all user state lives in device
storage.

## Runtime shape

```text
app/_layout.tsx
├── ThemeProvider          light / dark / system palette
├── SettingsProvider       persisted preferences (AsyncStorage)
├── SessionProvider        name + emoji + device id (AsyncStorage)
├── ToastProvider          transient confirmations
├── UpdatesProvider        feed polling, version comparison, modal state
└── AppShell               responsive chrome
    ├── desktop sidebar   (>= 1024 px)
    ├── mobile top bar    (< 1024 px)
    ├── content column    (max 1120 px)
    └── floating nav      (< 1024 px)
```

`SessionGate` renders onboarding before the shell until a session exists. The gate is
local-only: a name, an emoji and a generated device ID, with no network calls.

### Routes

| Route | File | Purpose |
| --- | --- | --- |
| `/` | `src/app/index.tsx` | Greeting hero, live update card, toolkit preview |
| `/tools` | `src/app/tools.tsx` | Focus timer, unit converter, scratchpad |
| `/settings` | `src/app/settings.tsx` | Profile, appearance, updates, about, reset |
| `*` | `src/app/+not-found.tsx` | Friendly 404 with a route back home |

Screens wrap their content in `Screen`, which owns the scroll container and appends the
global `AppFooter`. The footer is the only download surface in the product: Android APK,
Windows installer, Linux AppImage, web app and the install guide.

## Design system

`src/features/theme/tokens.ts` holds spacing, radii, typography and the two palettes
(`light`, `dark`). Components never hard-code colors; they read the active theme through
`useTheme()`. `theme-provider.tsx` resolves `system` against the OS scheme and keeps the
web document background in sync.

Responsive behaviour is limited to:

- `useResponsive()` — width, height, `isMobile`, `isDesktop` breakpoints.
- `useMounted()` — safe for static web rendering (avoids hydration mismatches for dates,
  greetings and viewport text).
- `isElectron()` / `getDesktopPlatform()` — platform-aware download and feed behavior.

## Local state

| Key | Owner | Contents |
| --- | --- | --- |
| `omnia.session.v1` | SessionProvider | `{ name, emoji, deviceId, createdAt }` |
| `omnia.settings.v1` | SettingsProvider | theme mode, auto-check preference |
| `omnia.tools.focus.v1` | Focus timer | completed sessions and total minutes |
| `omnia.tools.notes.v1` | Scratchpad | plain-text notes |
| `omnia.updates.dismissed.v1` | UpdatesProvider | last dismissed version |
| `omnia.updates.last-checked.v1` | UpdatesProvider | ISO timestamp |
| `omnia.updates.feed.v1` | UpdatesProvider | last valid feed payload |

There is intentionally no cloud sync. Resetting local data in Settings removes every key
above and returns the app to onboarding.

## Update system

```text
tag v1.2.3
   │
   ├── release.yml ──► signed APK ──────────┐
   │                └► Windows .exe ────────┤
   │                └► Linux AppImage ──────┤
   │                                        ▼
   │                                 GitHub Release
   │                                        │
   │                                 write-feed.mjs
   │                                        │
   │                                        ▼
   │                    public/updates/latest.json (main)
   │                          │                        │
   │                  Vercel rebuild           raw.githubusercontent.com
   │                          │                        │
   └── deploy-docs.yml ──► install guide              │
                                                       │
                             installed app polls feed every 4 min
                                                       ▼
                                      UpdateModal + platform installer
```

`src/features/updates/feed.ts` chooses the feed URL:

- **Browser app:** `<current origin>/updates/latest.json`, deployed alongside the app.
- **Electron and Android:** the raw GitHub feed, so installs can discover releases
  published after the binary was built.

`compareVersions()` parses `major.minor.patch` and ignores pre-release suffixes for
ordering, so `1.1.0` beats `1.0.9` and `1.1.0-beta` is treated as `1.1.0`.

A modal is shown when the feed version is greater than `Constants.expoConfig.version`
and the user has not dismissed that exact version. Checks run 2.2 s after launch, on
`AppState` becoming active, every 4 minutes, and from explicit buttons in Home and
Settings. Network failures degrade to an "Offline" badge and never block the UI.

`installUpdate()` behaves by platform:

- **Browser/PWA:** reload the current page; the new deployment is already live.
- **Android:** open the latest `omnia.apk` and install over the previous version.
- **Windows:** open `omnia-windows.exe`.
- **Linux:** open `omnia-linux.AppImage`.
- **Unknown:** fall back to the web app.

### Signing and install-over-update

Android requires every APK to be signed with the same key to install over an existing
app. The release workflow restores the keystore from repository secrets, patches the
generated Gradle release config (`scripts/android-signing.mjs`) and builds with
`assembleRelease`. Losing the keystore prevents updates over existing installs; see
[RELEASING.md](RELEASING.md).

Windows and Linux builds are currently unsigned. Windows SmartScreen warns on first run;
Linux users may need `chmod +x omnia-linux.AppImage`.

## Web export

`app.json` sets `web.output: "static"` and no base path, so the export is rooted at `/`
for Vercel and for Electron.

`npm run build:web:routes` runs `expo export --platform web` and then
`scripts/expand-web.mjs`, which:

1. copies each route HTML to `<route>/index.html` for clean URLs,
2. copies `+not-found.html` to `404.html`,
3. writes `.nojekyll`.

`+html.tsx` injects the manifest, theme color, Apple meta tags and service-worker
registration. `public/sw.js` caches the shell for offline use and never caches
`updates/latest.json`, so a new release is visible immediately. Electron skips service
worker registration.

## Desktop shell

`desktop/main.cjs` starts a tiny HTTP server bound to `127.0.0.1` that serves
`desktop/app/` (the expanded web export) and opens it in a sandboxed `BrowserWindow`.
Serving over HTTP, rather than `file://`, keeps Expo Router's absolute asset URLs and
clean routes working.

`scripts/prepare-desktop.mjs` copies `dist/` to `desktop/app/`, generates the PNG/ICO
icons with Sharp and syncs the desktop package version with `app.json`. electron-builder
then produces:

- `omnia-windows.exe` — one-click NSIS installer with Start menu and desktop shortcuts.
- `omnia-linux.AppImage` — portable x86_64 AppImage.

The Electron window uses the same responsive shell, so it gets the desktop sidebar and
the footer download links. External links open in the system browser instead of inside
the app.

## Hosting split

| Host | Content | Workflow / config |
| --- | --- | --- |
| Vercel | Full app at `/` | `vercel.json` |
| GitHub Pages | Static install guide in `site/` | `deploy-docs.yml` |
| GitHub Releases | APK, EXE, AppImage | `release.yml` |

GitHub Pages used to host the app itself. `site/index.html` now unregisters the old
service worker and deletes its caches on first visit, so returning users see the guide
instead of a stale cached app.

## CI/CD

| Workflow | Trigger | Result |
| --- | --- | --- |
| `ci.yml` | push / PR to `main` | `npm ci`, typecheck, web export |
| `deploy-docs.yml` | push to `main` | Pages deployment of `site/` |
| `release.yml` | tag `v*` | APK + EXE + AppImage release, then feed commit |

All workflows pin Node 22. The release workflow uses Java 17 (Temurin) for Android.
`release.yml` has `contents: write` so it can publish the release and commit the feed.
Vercel deploys independently from its Git integration on every push to `main`.

## Extension points

- Add a route by creating a file in `src/app/`; the sidebar and mobile nav read
  `src/components/app-shell.tsx`.
- Add a tool as a component under `src/features/tools/`, then mount it on `/tools` and
  add a card to the `tools` array in `src/app/index.tsx`.
- Add persisted state by following the provider pattern: a versioned AsyncStorage key,
  a hydration flag and a context hook.
- Add a release by bumping `app.json` through `scripts/version.mjs`; never edit the feed
  by hand for a real release.
