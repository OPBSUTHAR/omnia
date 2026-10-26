# Omnia

**One app. Every device.**

Omnia is a local-first, cross-platform workspace with one shared codebase:

- a signed **Android APK**,
- a real **Windows installer** and **Linux AppImage** built with Electron,
- a responsive **web app** on Vercel,
- and a static **install guide** on GitHub Pages.

It ships with per-device sessions, a focus timer, unit converter, scratchpad, light/dark
themes, and a real in-app update dialog that fires when a new release is published.

Built by [Omprakash Suthar (@OPBSUTHAR)](https://github.com/OPBSUTHAR).

---

## Download & install

| Platform | Build | Link |
| --- | --- | --- |
| **Android** | Signed APK, Android 8+ | [omnia.apk](https://github.com/OPBSUTHAR/omnia/releases/latest/download/omnia.apk) |
| **Windows** | NSIS installer, 64-bit | [omnia-windows.exe](https://github.com/OPBSUTHAR/omnia/releases/latest/download/omnia-windows.exe) |
| **Linux** | Portable AppImage, x86_64 | [omnia-linux.AppImage](https://github.com/OPBSUTHAR/omnia/releases/latest/download/omnia-linux.AppImage) |
| **Web** | Full React app | [omnia-opbsuthar.vercel.app](https://omnia-opbsuthar.vercel.app/) |
| **iPhone / iPad** | Safari → Share → Add to Home Screen | [Web app](https://omnia-opbsuthar.vercel.app/) |

Step-by-step instructions live at **[opbsuthar.github.io/omnia](https://opbsuthar.github.io/omnia/)**.
The download links also appear in the footer of every app screen.

Every install keeps its own session: a display name, an emoji badge, and a generated
device ID stored only on that device. Nothing is uploaded, and there is no account to
create.

## What's inside

- **Home** — a live greeting, session/device/build tiles, the update feed status and the
  toolkit preview.
- **Tools** — a focus timer with session history, a unit converter (length, mass,
  temperature, data), and an autosaving scratchpad.
- **Settings** — profile editing, light/dark/system theme, auto update checks, manual
  update checks, release notes, links and a full local-data reset.
- **Update dialog** — checks on launch, on foreground, every 4 minutes, and on demand.
  When the feed is newer than the installed build, Omnia shows release notes and the
  installer for the current platform.
- **Global footer** — Android, Windows, Linux and web builds plus the install guide.

The layout adapts from a 320 px phone to an ultrawide desktop: a floating bottom nav on
mobile, a full sidebar from 1024 px, and a capped 1120 px content column in between.

## Tech stack

- [Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/) / React Native 0.88 / React 19
- [Expo Router](https://docs.expo.dev/router/introduction/) with static web export
- TypeScript (strict), Space Grotesk, Ionicons, Expo Linear Gradient
- AsyncStorage for local-first state
- Electron 45 + electron-builder for the Windows and Linux desktop apps
- GitHub Actions for CI, signed releases and the update feed
- Vercel for the web app; GitHub Pages for the documentation site

## Run it locally

Requirements: Node 22+ and npm.

```bash
npm install
npm start              # Expo dev server (press w for web, a for Android)
npm run typecheck      # TypeScript, strict
npm run build:web:routes  # static export into dist/ with clean URLs
npm run verify         # typecheck + web build
```

Desktop development:

```bash
npm run build:web:routes
node scripts/prepare-desktop.mjs
npm ci --prefix desktop
npm --prefix desktop start
```

`npm run build:desktop:win` produces `desktop/release/omnia-windows.exe`.
`npm run build:desktop:linux` must run on Linux and produces `desktop/release/omnia-linux.AppImage`.

To build a release APK locally you need the Android SDK and Java 17; the repository's CI
does this automatically on every version tag.

## Releasing (how the update popup is proven)

```bash
npm run release:minor -- "Windows and Linux desktop installers" "Downloads now live in the app footer"
git add -A
git commit -m "release: v1.1.0"
git tag v1.1.0
git push origin main --tags
```

The tag starts `.github/workflows/release.yml`, which:

1. builds exactly the tagged commit,
2. prebuilds and signs the Android APK with the repository keystore,
3. exports the web app and packages the Windows NSIS installer on `windows-latest`,
4. packages the Linux AppImage on `ubuntu-latest`,
5. publishes one GitHub Release containing `omnia.apk`, `omnia-windows.exe` and
   `omnia-linux.AppImage`,
6. writes the same version, notes and platform URLs into `public/updates/latest.json`
   and commits it to `main`,
7. triggers the Vercel web deployment and the GitHub Pages docs deployment.

Installed apps poll the update feed, so the in-app dialog appears as soon as the release
is published. The web app reloads to pick up the new deployment; Android, Windows and
Linux download the matching installer.

See [docs/RELEASING.md](docs/RELEASING.md) for the checklist and
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how the pieces fit together.

## Project structure

```text
omnia/
├── src/
│   ├── app/                    # Expo Router routes (screens only)
│   │   ├── _layout.tsx         # providers, fonts, splash, shell
│   │   ├── index.tsx           # home / greetings
│   │   ├── tools.tsx           # toolkit
│   │   ├── settings.tsx        # profile, theme, updates, about
│   │   └── +html.tsx           # PWA head, manifest, service worker
│   ├── components/             # shell, footer, logo, gate, update modal
│   │   └── ui/                 # design-system primitives
│   ├── features/
│   │   ├── session/            # local per-device session
│   │   ├── settings/           # persisted preferences
│   │   ├── theme/              # tokens + light/dark provider
│   │   ├── tools/              # focus timer, converter, scratchpad
│   │   └── updates/            # feed client, types, provider
│   └── lib/                    # device info, links, dialogs, hooks
├── desktop/                    # Electron shell for Windows/Linux
│   ├── main.cjs                # local static server + BrowserWindow
│   └── package.json            # electron-builder targets
├── site/                       # static install guide (GitHub Pages)
├── public/                     # manifest, service worker, icons, update feed
├── scripts/                    # icons, versioning, feed, desktop payload
├── release-notes/              # one JSON file per released version
├── docs/                       # architecture and release documentation
├── vercel.json                 # Vercel build/output config
└── .github/workflows/          # CI, Pages docs, signed multi-platform release
```

## Hosting split

The app and the install guide intentionally have different jobs:

- **Vercel** serves the actual React app at `/`. The web build is a full client-side
  application after hydration; downloads are not the point of the page.
- **GitHub Pages** serves `site/`, a static guide with screenshots, install steps,
  release notes and direct installer links. It keeps working even if the app host is
  unavailable and it removes the old Omnia service worker from returning visitors.

`src/lib/links.ts` and `scripts/write-feed.mjs` are the two places that hold the public
app/docs URLs. Update both if the Vercel project gets a different domain.

## Design principles

- **Local-first.** No backend, no login, no telemetry. Your session and scratchpad stay
  in device storage.
- **One codebase, every screen.** The same routes render the phone app, the desktop app
  and the website, reflowing rather than forking.
- **Updates you can see.** The release pipeline and the in-app dialog are part of the
  product, not an afterthought.
- **Small, honest tools.** Each utility does one job well and saves automatically.

## License

MIT © 2026 Omprakash Suthar ([@OPBSUTHAR](https://github.com/OPBSUTHAR)). See
[LICENSE](LICENSE).
