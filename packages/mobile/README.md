# opencode Android

Expo Android shell for the responsive opencode web app.

The APK bundles the built `packages/app` UI under Android assets and loads it in a WebView. The native shell only handles the initial server connection and secure persistence; the actual opencode interface stays in `packages/app`.

## Development

Start opencode server:

```bash
OPENCODE_SERVER_PASSWORD=your-password opencode serve --hostname 0.0.0.0 --port 4096
```

Start mobile app:

```bash
bun android
```

Use your machine LAN IP in the app, for example `http://192.168.1.10:4096`.

Do not expose `opencode serve` directly to the public internet without HTTPS and access controls.

## Bundled web UI

The `bun android` script runs Expo prebuild, then `bun run build:web-assets`, then `expo run:android`. The web asset step builds `packages/app` with relative asset paths and copies the result to:

```text
packages/mobile/android/app/src/main/assets/opencode-web
```

When changing the app UI, make the change in `packages/app`, then rebuild mobile web assets:

```bash
bun run build:web-assets
```
