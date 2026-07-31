# Android update pipeline

Use this procedure whenever the T3 Code Capacitor app must be updated on a phone, tablet, or both.
The same adaptive APK serves both form factors.

## Non-negotiable invariants

- Preserve the application id `tools.t3code.capacitor`.
- Preserve the `https://localhost` Capacitor origin and keep `server.url` absent.
- Preserve the Android signing identity used by the installed app.
- Install updates only with `adb install -r`.
- Never run `adb uninstall`, `pm clear`, clear app storage, or uninstall the app to solve an update
  problem.
- Never use a signature or downgrade workaround without investigating the installed build first.
- Never commit device data, pairing credentials, access tokens, private keys, or backups.

The paired environments and authentication state live in the app's private storage. An in-place
update with the same package id and signing identity preserves that storage.

## Source layout

- `mobile/shared/`: behavior and styling used by phones and tablets.
- `mobile/phone/`: compact phone interface.
- `mobile/tablet/`: tablet-only adaptations when needed; otherwise the tablet uses upstream layout.
- `patches/mobile-integration.patch`: minimal connection points between mobile modules and upstream.
- `scripts/update-android.mjs`: safe upstream update, validation, and APK build.

Do not edit the sibling T3 Code checkout to implement mobile behavior. Refresh the integration patch
or the modules in this repository.

## Standard procedure

### 1. Inspect both repositories

```sh
git status --short --branch
git -C ../t3code status --short --branch
```

Investigate unexpected changes before proceeding. The sibling `t3code` checkout must be clean.

### 2. Identify the target device

```sh
adb devices -l
```

If more than one device is connected, choose the exact serial:

```sh
adb -s DEVICE_SERIAL shell pm path tools.t3code.capacitor
```

Record whether the package is already installed. Do not remove it.

### 3. Update, validate, and build

```sh
JAVA_HOME=/opt/homebrew/opt/openjdk@21 \
  T3CODE_PRIMARY_URL=https://mac-mini-de-gabriel.tailad333c.ts.net \
  corepack pnpm update:android
```

Preserve the current primary environment URL unless the user explicitly requests a change.

This command:

1. fetches the configured upstream remote;
2. refuses a dirty or locally divergent T3 Code checkout;
3. fast-forwards the tracked upstream branch;
4. applies the mobile modules and integration patch in a disposable clone;
5. checks formatting and TypeScript;
6. runs the web unit test suite;
7. builds and synchronizes the hosted-client web bundle;
8. generates the debug APK with Gradle.

If the integration no longer applies, update only `patches/mobile-integration.patch` and the
corresponding files under `mobile/`. Keep the sibling T3 Code checkout unchanged.

### 4. Verify the artifact

```sh
unzip -p android/app/build/outputs/apk/debug/app-debug.apk \
  assets/public/t3code-capacitor-build.json
shasum -a 256 android/app/build/outputs/apk/debug/app-debug.apk
```

Confirm that:

- `revision` is the expected upstream commit;
- `appVersion` is the latest upstream version tag reachable from that commit;
- `patches` contains `mobile-integration.patch`;
- `mobileSources` contains `shared`, `phone`, and `tablet`;
- `primaryEnvironmentUrl` is the intended server;
- the APK contains `assets/native-bridge.js` and `assets/public/t3code-capacitor.css`.

Optional signing inspection when `apksigner` is available:

```sh
apksigner verify --print-certs android/app/build/outputs/apk/debug/app-debug.apk
```

### 5. Install without losing data

For the selected device:

```sh
adb -s DEVICE_SERIAL install -r android/app/build/outputs/apk/debug/app-debug.apk
```

For both phone and tablet, build once and repeat only this installation command with each device
serial. A successful result must end with `Success`.

If installation reports a signing mismatch, downgrade, or incompatible update, stop. Do not
uninstall the existing app and do not clear its data. Locate the correct signing identity or inspect
the installed version before trying again.

### 6. Verify the installed app

```sh
adb -s DEVICE_SERIAL shell pm path tools.t3code.capacitor
adb -s DEVICE_SERIAL shell monkey \
  -p tools.t3code.capacitor \
  -c android.intent.category.LAUNCHER \
  1
```

Confirm in the app that:

- it opens normally;
- the previously paired environments are still present;
- existing chats and private state remain available;
- the phone uses the compact interface;
- the tablet retains the tablet layout;
- system bars, safe areas, keyboard behavior, Enter handling, and sheets still work.

Do not repair missing state by re-pairing or clearing storage until the cause has been investigated
and the user has approved the recovery action.

## Failure rules

- Patch conflict: refresh the small integration patch in this repository.
- Formatting, type, test, or build failure: do not install an APK.
- Device offline or unauthorized: stop and restore the ADB connection.
- `INSTALL_FAILED_UPDATE_INCOMPATIBLE`: stop; the signing identity or package lineage is wrong.
- `INSTALL_FAILED_VERSION_DOWNGRADE`: stop; inspect versioning before considering any action.
- Missing environments after installation: stop using the app and investigate without clearing data.

## Definition of done

An Android update is complete only when:

- the T3 Code checkout is clean and aligned with its upstream branch;
- the mobile compatibility check, tests, web build, and Gradle build pass;
- the APK metadata points to the intended revision and server;
- `adb install -r` succeeds on every requested device;
- the app opens and the existing environments/data are confirmed;
- the final report names the upstream revision, target device serials, APK path, and checksum without
  exposing credentials or private device data.
