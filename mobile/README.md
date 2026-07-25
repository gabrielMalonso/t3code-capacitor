# Mobile adaptations

This directory is the source of truth for behavior that exists only in the Capacitor wrapper.

- `shared/` contains Android behavior and styling used by phones and tablets.
- `phone/` contains the compact phone interface.
- `tablet/` documents and contains tablet-only behavior when needed.

`scripts/sync-web.mjs` copies `phone/` and the web sources from `shared/` into a disposable T3 Code
clone before building. Files under `patches/` only connect those modules to upstream state and
components.

The update contract is:

1. update the clean sibling `t3code` checkout;
2. run `pnpm check:mobile` to verify the integration patch;
3. run `pnpm build:android`;
4. test a phone-width and tablet-width layout;
5. install with `adb install -r`.

Do not place complete copies of upstream components here. Add isolated components and keep the
integration patch small.
