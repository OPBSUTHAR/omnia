# Architecture

Omnia is a single Expo Router project that targets Android, the web, and installable
desktop PWAs. There is no server component: every screen is client-rendered, and all
user state lives in device storage.

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
| `/` | `src/app/index.tsx` | Greeting hero, live update card, toolkit preview, downloads |
| `/tools` | `src/app/tools.tsx` | Focus timer, unit converter, scratchpad |
| `/settings` | `src/app/settings.tsx` | Profile, appearance, updates, about, reset |
| `*` | `src/app/+not-found.tsx` | Friendly 404 with a route back home |

Screens compose primitives from `src/components/ui/` and feature components from
`src/features/`. Route files contain no reusable logic, per the Expo Router convention.

## Design system

`src/features/theme/tokens.ts` holds spacing, radii, typography and the two palettes
(`light`, `dark`). Components never hard-code colors; they read the active theme through
`useTheme()`. `theme-provider.tsx` resolves `system` against the OS scheme and keeps the
web document background in sync.

Responsive behaviour is limited to three hooks:

- `useResponsive()` — width, height, `isMobile`, `isDesktop` breakpoints.
- `useMounted()` — safe for static web rendering (avoids hydration mismatches for
  dates, greetings and viewport text).
- `usePwaInstall()` — captures `beforeinstallprompt` on the web and exposes `install()`.

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
   ├── android-release.yml ──► signed APK ──► GitHub Release
   │                                      └──► write-feed.mjs
   │                                             │
   │                                             ▼
   │                              public/updates/latest.json (main)
   │                                             │
   └── deploy-web.yml ──► GitHub Pages ──────────┘
                                                │
                         installed app polls feed every 4 min
                                                ▼
                                   UpdateModal + APK download
```

`src/features/updates/feed.ts` chooses the feed URL:

- **Web:** `<origin><baseUrl>/updates/latest.json` (the static export copies `public/`).
- **Native:** `https://raw.githubusercontent.com/OPBSUTHAR/omnia/main/public/updates/latest.json`.

`compareVersions()` parses `major.minor.patch` and ignores pre-release suffixes for
ordering, so `1.1.0` beats `1.0.9` and `1.1.0-beta` is treated as `1.1.0`.

A modal is shown when the feed version is greater than `Constants.expoConfig.version`
and the user has not dismissed that exact version. Checks run 2.2 s after launch, on
`AppState` becoming active, every 4 minutes, and from explicit buttons in Home and
Settings. Network failures degrade to an "Offline" badge and never block the UI.

### Signing and install-over-update

Android requires every APK to be signed with the same key to install over an existing
app. The release workflow restores the keystore from repository secrets, patches the
generated Gradle release config (`scripts/android-signing.mjs`) and builds with
`assembleRelease`. Keeping that keystore safe is the one operational hard requirement;
see [RELEASING.md](RELEASING.md).

## Web export and Pages

`app.json` sets `web.output: "static"` and `experiments.baseUrl: "/omnia"`, so Expo
renders `/`, `/tools`, `/settings` and `/+not-found` to HTML and prefixes every asset
with `/omnia/`.

`npm run build:web` alone produces `dist/tools.html`, which GitHub Pages would serve at
`/omnia/tools.html`. `scripts/expand-web.mjs` runs after the export and:

1. copies each route HTML to `<route>/index.html` for clean URLs,
2. copies `+not-found.html` to `404.html`,
3. writes `.nojekyll` so `_expo/` assets are published.

`deploy-web.yml` uploads that directory with `actions/upload-pages-artifact`.

`+html.tsx` injects the manifest, theme color, Apple meta tags and service-worker
registration. `public/sw.js` caches the shell for offline use and never caches
`updates/latest.json`, so a new release is visible immediately.

## CI/CD

| Workflow | Trigger | Result |
| --- | --- | --- |
| `ci.yml` | push / PR to `main` | `npm ci`, typecheck, web export |
| `deploy-web.yml` | push to `main` | Pages deployment of `dist/` |
| `android-release.yml` | tag `v*` | signed APK release + feed commit |

All workflows pin Node 22 and Java 17 (Temurin). The Android workflow has
`contents: write` so it can publish the release and commit the feed.

## Extension points

- Add a route by creating a file in `src/app/`; the sidebar and mobile nav read
  `src/components/app-shell.tsx`.
- Add a tool as a component under `src/features/tools/`, then mount it on `/tools` and
  add a card to the `tools` array in `src/app/index.tsx`.
- Add persisted state by following the provider pattern: a versioned AsyncStorage key,
  a hydration flag and a context hook.
- Add a release by bumping `app.json` through `scripts/version.mjs`; never edit the feed
  by hand for a real release.
