# Omnia

**One app. Every device.**

Omnia is a local-first, cross-platform super-app shell: an Android APK, a responsive web
app, and an installable desktop PWA that all share the same codebase. It ships with
per-device sessions, a small but growing toolkit, light/dark themes, and a real in-app
update dialog that fires when a new release is published.

Built by [Omprakash Suthar (@OPBSUTHAR)](https://github.com/OPBSUTHAR).

---

## Download & install

| Platform | How to get it | Link |
| --- | --- | --- |
| **Android** | Download the signed APK and open it. Android may ask you to allow installs from your browser the first time. | [omnia.apk](https://github.com/OPBSUTHAR/omnia/releases/latest/download/omnia.apk) |
| **Windows / Linux / macOS** | Open the web app in Chrome or Edge, then use the install button in the address bar (or **Install Omnia** inside the app). | [opbsuthar.github.io/omnia](https://opbsuthar.github.io/omnia/) |
| **iPhone / iPad** | Open the site in Safari → Share → **Add to Home Screen**. | [opbsuthar.github.io/omnia](https://opbsuthar.github.io/omnia/) |
| **Web** | Works in any modern browser at any screen size. | [opbsuthar.github.io/omnia](https://opbsuthar.github.io/omnia/) |

Every install keeps its own session: a display name, an emoji badge, and a generated
device ID stored only on that device. Nothing is uploaded, and there is no account to
create.

## What's inside

- **Home** — a live greeting, session/device/build tiles, the update feed status, the
  toolkit preview and download options.
- **Tools** — a focus timer with session history, a unit converter (length, mass,
  temperature, data), and an autosaving scratchpad.
- **Settings** — profile editing, light/dark/system theme, auto update checks, manual
  update checks, release notes, links and a full local-data reset.
- **Update dialog** — checks on launch, on foreground, every 4 minutes, and on demand.
  When the published feed is newer than the installed build, Omnia shows release notes
  and a one-tap download that installs over the previous APK.

The layout adapts from a 320 px phone to an ultrawide desktop: a floating bottom nav on
mobile, a full sidebar from 1024 px, and a capped 1120 px content column in between.

## Tech stack

- [Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/) / React Native 0.88 / React 19
- [Expo Router](https://docs.expo.dev/router/introduction/) with static web export
- TypeScript (strict), Space Grotesk, Ionicons, Expo Linear Gradient
- AsyncStorage for local-first state
- GitHub Actions for CI, GitHub Pages for hosting, and a tag-driven Android release
  pipeline (no Expo account required)

## Run it locally

Requirements: Node 20+ and npm.

```bash
npm install
npm start          # Expo dev server (press w for web, a for Android)
npm run typecheck  # TypeScript, strict
npm run build:web  # static export into dist/
npm run verify     # typecheck + web build
```

`npm run android` opens the app on a connected device or emulator. To build a release
APK locally you need the Android SDK and Java 17; the repository's CI does this
automatically on every version tag.

## Releasing (how the update popup is proven)

```bash
npm run release:patch -- "Focus timer now keeps a session history" "Faster cold start"
git add -A
git commit -m "release: v1.0.1"
git tag v1.0.1
git push origin main --tags
```

The tag starts `.github/workflows/android-release.yml`, which:

1. bumps nothing locally — it builds exactly the tagged commit,
2. prebuilds the native Android project and signs it with the repository keystore,
3. publishes a GitHub Release with `omnia.apk`,
4. writes the same version and notes into `public/updates/latest.json` and commits it,
5. triggers the Pages deployment so the web build and feed update together.

Installed apps poll `public/updates/latest.json` on the `main` branch. As soon as the
feed commit lands, every open install sees the new version and shows the in-app update
dialog.

See [docs/RELEASING.md](docs/RELEASING.md) for the full checklist and
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
│   ├── components/             # app shell, logo, session gate, update modal
│   │   └── ui/                 # design-system primitives
│   ├── features/
│   │   ├── session/            # local per-device session
│   │   ├── settings/           # persisted preferences
│   │   ├── theme/              # tokens + light/dark provider
│   │   ├── tools/              # focus timer, converter, scratchpad
│   │   └── updates/            # feed client, types, provider
│   └── lib/                    # device info, links, dialogs, hooks
├── public/                     # manifest, service worker, icons, update feed
├── scripts/                    # icons, versioning, feed writer, web expander
├── release-notes/              # one JSON file per released version
├── docs/                       # architecture and release documentation
└── .github/workflows/          # CI, Pages deploy, Android release
```

## Design principles

- **Local-first.** No backend, no login, no telemetry. Your session and scratchpad stay
  in device storage.
- **One codebase, every screen.** The same routes render the phone app, the desktop
  browser and the installed PWA, reflowing rather than forking.
- **Updates you can see.** The release pipeline and the in-app dialog are part of the
  product, not an afterthought.
- **Small, honest tools.** Each utility does one job well and saves automatically.

## License

MIT © 2026 Omprakash Suthar ([@OPBSUTHAR](https://github.com/OPBSUTHAR)). See
[LICENSE](LICENSE).
