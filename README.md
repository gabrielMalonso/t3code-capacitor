# T3 Code Capacitor

Independent Android wrapper for the current T3 Code web client. The wrapper lives outside the
upstream-synchronized `t3code` checkout and copies the compiled web app into its own Capacitor
bundle.

## Build and install on Gabriel's tablet

```sh
corepack pnpm install
corepack pnpm install:tablet
```

The Android application id is `tools.t3code.capacitor`, so it can coexist with the Preview,
development, and legacy Capacitor builds.

The Gradle build is pinned to the installed Homebrew OpenJDK 21. Capacitor 8 targets Java 21, while
the generated Gradle 8 project does not run correctly on the Mac's default JDK 25 runtime.

## Source refresh

`pnpm build:web` builds `../t3code/apps/web`, copies its `dist` output to `www`, and rewrites every
safe-area use to prefer Capacitor System Bars' injected `--safe-area-inset-*` values with browser
`env()` fallbacks. `viewport-fit=cover` remains enabled.

The Mac Tailscale endpoint is the default primary environment and the native WebView's same-origin
server URL. This lets the secure browser session cookie and WebSocket connection work correctly.
Set `T3CODE_SOURCE` to use a different T3 Code checkout or `T3CODE_PRIMARY_URL` to build a different
local fallback bundle; update `capacitor.config.json` as well when changing the live primary host.

`MainActivity` reapplies the Capacitor System Bars insets to full-height and fixed T3 Code surfaces
after every page load. This keeps the title bar, sidebar footer, composer, and settings controls out
of both the Android status bar and the gesture/task bar in portrait and landscape. It also follows
the T3 Code light/dark theme for status-bar content and aligns the floating sidebar control below
the top inset. On Android, new drafts open without focusing the composer, and Enter inserts a line
break instead of sending; messages are submitted with the send button.

## Remote environments

The client is paired independently with the existing HTTPS Tailscale Serve endpoints:

- Mac: `https://mac-mini-de-gabriel.tailad333c.ts.net`
- Linux: `https://gabriel-alonso-msi.tailad333c.ts.net`

Pairing credentials are stored only in the Android application's private storage and are never
committed to this repository.
