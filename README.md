# T3 Code Capacitor

An independent Android wrapper for [T3 Code](https://github.com/pingdotgg/t3code), built with
[Capacitor](https://capacitorjs.com/). It keeps the Android-specific adjustments separate from the
upstream T3 Code checkout, so the web application can continue moving quickly without overwriting
the mobile wrapper.

This repository contains only the wrapper and Android project. The generated T3 Code web bundle is
copied into `www/` during a build and is not committed.

## Android adaptations

The wrapper makes a small set of runtime changes tailored to Android tablets:

- applies the top, bottom, left, and right safe-area insets in portrait and landscape;
- keeps the composer, sidebar, title bar, and settings controls clear of Android system bars;
- follows the active T3 Code theme with light or dark status-bar content;
- uses the official purple T3 Code Preview artwork as an adaptive Android launcher icon;
- aligns the floating sidebar toggle below the status bar;
- prevents the keyboard from opening automatically when a chat is opened or changed;
- makes Enter insert a line break instead of sending, leaving submission to the send button.

The web client itself remains upstream T3 Code. The Android adjustments are injected by
`MainActivity`, while `scripts/sync-web.mjs` builds the web client and adds Capacitor-compatible
safe-area fallbacks to the generated bundle.

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

Set the primary server in `capacitor.config.json`:

```json
{
  "server": {
    "url": "https://your-t3-code-server.example.com"
  }
}
```

Use the same URL as `T3CODE_PRIMARY_URL` when refreshing the web bundle. A Tailscale Serve HTTPS
endpoint works well because it gives the WebView a secure origin while keeping the server private
to the tailnet.

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

Update the separate T3 Code checkout, then rebuild this wrapper:

```sh
git -C ../t3code pull --ff-only
T3CODE_PRIMARY_URL=https://your-t3-code-server.example.com corepack pnpm build:android
```

The wrapper modifications do not need to be reapplied after each upstream update. They live in this
repository and run again whenever the web bundle is synchronized.

## License

MIT
