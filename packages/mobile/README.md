# opencode mobile

Expo React Native client for `opencode serve`.

## Development

Start opencode server:

```bash
OPENCODE_SERVER_PASSWORD=your-password opencode serve --hostname 0.0.0.0 --port 4096
```

Start mobile app:

```bash
bun dev
```

Use your machine LAN IP in the app, for example `http://192.168.1.10:4096`.

Do not expose `opencode serve` directly to the public internet without HTTPS and access controls.
