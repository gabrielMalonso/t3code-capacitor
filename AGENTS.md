# AGENTS.md

## Purpose

- This is a personal Capacitor wrapper for the mobile version of T3 Code, not a fork of T3 Code.
- Keep the sibling `t3code` repository clean and aligned with upstream.
- Keep only the Android project, wrapper configuration, build scripts, and mobile adaptations here.

## Mobile adaptations

- Store web-client changes as versioned patches under `patches/`.
- `scripts/sync-web.mjs` must apply those patches in a temporary clone and must never modify the
  original T3 Code checkout.
- Keep native Android behavior in the Android wrapper. Current adaptations cover safe areas, system
  bars, the launcher icon, composer keyboard behavior, and Enter as a line break.
- Phone-only web patches cover the compact chat header, work-context controls, and draggable mobile
  sheets.
- Phone-specific layout changes must not alter the tablet layout.

## Updates

- Update the separate T3 Code checkout from upstream, then rebuild this wrapper.
- If an upstream update conflicts with a patch, refresh that patch here instead of committing changes
  to the T3 Code repository.
- Keep the Capacitor app loading its bundled frontend; do not add `server.url` back.
- Build the frontend in hosted-client mode. Do not compile the remote backend as `VITE_HTTP_URL`,
  because cross-origin primary cookie authentication does not persist in the Capacitor origin.

## Credentials

- Preserve `appId`, the `https://localhost` Capacitor origin, and the Android signing identity between
  builds.
- Update an installed app with `adb install -r`; do not uninstall it or clear its data unless the user
  explicitly requests that.
- Never commit pairing credentials, access tokens, private keys, or device data.
- Builds made on another computer must use the same signing identity to update the existing app
  without losing its private data.
