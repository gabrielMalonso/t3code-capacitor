# T3 Code Capacitor

An independent Android wrapper for [T3 Code](https://github.com/pingdotgg/t3code), built with
[Capacitor](https://capacitorjs.com/). It keeps the Android-specific adjustments separate from the
upstream T3 Code checkout, so the web application can continue moving quickly without overwriting
the mobile wrapper.

This repository contains only the wrapper, Android project, and mobile patches. The generated T3
Code web bundle is copied into `www/` during a build and is not committed. The T3 Code source
checkout stays clean and can continue tracking upstream without wrapper commits or local changes.

## Android adaptations

The wrapper makes a small set of changes tailored to Android phones and tablets:

- applies the top, bottom, left, and right safe-area insets in portrait and landscape;
- keeps the composer, sidebar, title bar, and settings controls clear of Android system bars;
- follows the active T3 Code theme with light or dark status-bar content;
- uses the official purple T3 Code Preview artwork as an adaptive Android launcher icon;
- aligns the floating sidebar toggle below the status bar;
- prevents the keyboard from opening automatically when a chat is opened or changed;
- makes Enter insert a line break instead of sending, leaving submission to the send button;
- condenses the checkout, pull request, and branch controls into a phone-only work-context sheet;
- keeps only Git and an overflow menu in the phone header, with terminal, side-panel, project-action,
  and editor controls inside the overflow sheet;
- gives phone sheets a drag handle, medium and full-height snap points, and swipe-down dismissal.

Native Android adjustments are injected by `MainActivity`. Small web-client adaptations live as
versioned files under `patches/`. During a build, `scripts/sync-web.mjs` clones the exact revision of
the clean T3 Code checkout into a temporary directory, applies those patches, builds the web client,
adds Capacitor-compatible safe-area fallbacks, and removes the temporary clone. The tablet layout is
left unchanged by the phone-only toolbar patch.

## Requirements

- Node.js 22 or newer with Corepack
- pnpm 11
- Android SDK and `adb`
- JDK 21
- a local checkout of T3 Code
- an HTTPS T3 Code server reachable by the Android device

By default, the build expects the T3 Code checkout in a sibling directory named `t3code`. Set
`T3CODE_SOURCE` to use another location.

## Configuration

Set `T3CODE_PRIMARY_URL` when refreshing the web bundle. The URL is recorded in the build metadata
and used when provisioning the app. A Tailscale Serve HTTPS endpoint works well because it keeps the
server private to the tailnet.

The Capacitor configuration intentionally has no `server.url`: the app loads its bundled frontend
from the local Capacitor origin in T3 Code's hosted-client mode. Pairing registers the remote backend
as a bearer-authenticated environment in the app's private IndexedDB storage. This allows the wrapper
patches to take effect and preserves authentication across `adb install -r` updates.

Pairing is performed independently inside the Android app. Pairing credentials remain in the
application's private storage and are never written to this repository.

## Build

```sh
corepack pnpm install
T3CODE_PRIMARY_URL=https://your-t3-code-server.example.com corepack pnpm build:android
```

On Apple Silicon Macs with Homebrew OpenJDK 21:

```sh
JAVA_HOME=/opt/homebrew/opt/openjdk@21 \
  T3CODE_PRIMARY_URL=https://your-t3-code-server.example.com \
  corepack pnpm build:android
```

The debug APK is generated at
`android/app/build/outputs/apk/debug/app-debug.apk`.

## Install

Connect an Android device with USB debugging enabled, then run:

```sh
corepack pnpm install:android
```

If more than one device is connected, select one with `ANDROID_SERIAL`:

```sh
ANDROID_SERIAL=DEVICE_SERIAL corepack pnpm install:android
```

The application id is `tools.t3code.capacitor`, allowing it to coexist with other T3 Code Android
builds.

## Updating from T3 Code

Update the separate, clean T3 Code checkout, then rebuild this wrapper:

```sh
git -C ../t3code pull --ff-only
T3CODE_PRIMARY_URL=https://your-t3-code-server.example.com corepack pnpm build:android
```

The build refuses to run when the source checkout has local changes. Wrapper modifications are
applied automatically inside a disposable clone and never touch that checkout.

If an upstream update changes one of the patched areas, `git apply --check` stops the build before
anything is generated. Recreate the affected patch against the new upstream revision, save it in
`patches/`, return the T3 Code checkout to a clean state, and rebuild.

## License

MIT
