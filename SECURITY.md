# Security policy

Omnia is a local-first app. It has no backend, no accounts and no telemetry. Sessions,
preferences, notes and tool history are stored only on the device that created them.

## Supported versions

| Version | Supported |
| --- | --- |
| Latest release | Yes |
| Older releases | Best effort — update through the in-app dialog |

## Reporting a vulnerability

Please do not open a public issue for a security problem. Use GitHub's private
vulnerability reporting:

https://github.com/OPBSUTHAR/omnia/security/advisories/new

Include the affected version, the platform (Android, web, desktop PWA), reproduction
steps and the impact you believe it has. You can expect an acknowledgement within a few
days.

## Scope

In scope:

- the Android APK published on GitHub Releases,
- the web app at https://opbsuthar.github.io/omnia/,
- the update feed and service worker,
- this source repository.

Out of scope:

- issues in third-party browsers or operating systems,
- attacks that require a rooted device or physical access,
- social engineering.

## Release integrity

- Android release builds are signed with a keystore that is never committed; CI
  restores it from encrypted repository secrets.
- The update feed is served from the `main` branch and is only written by the release
  workflow after the APK has been published.
- The web app is deployed from the same commit by GitHub Actions; no manual uploads.
