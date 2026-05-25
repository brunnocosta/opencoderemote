# Mobile client for opencode server

## Goal

Create a cross-platform mobile client, starting with Android and keeping iOS support as a first-class follow-up. The app connects to an existing `opencode serve` instance running on a PC or cloud server.

## Non-goals

- Run the opencode engine locally on Android in the first version.
- Replace the TUI or desktop app.
- Expose a public unauthenticated opencode server.

## Platform choice

Use React Native with Expo in a new `packages/mobile` workspace package.

Reasons:

- The repo is already TypeScript-heavy.
- The opencode server exposes HTTP, SSE, and OpenAPI.
- The existing JS SDK in `packages/sdk/js` can provide types and possibly a client interface.
- Android and iOS can share most application code.

Flutter remains viable, but it would require a Dart client layer and more duplicated API typing.

## Architecture

The mobile app is a client-only module. The opencode engine stays on the server.

Primary modules:

- Connection store: saved server URL, username, password, last-used project/session.
- Credential storage: store secrets in platform secure storage.
- Opencode client: small wrapper around server HTTP APIs and SSE streams.
- Event stream: subscribe to `/event` or `/global/event`, reconnect, fan out updates to UI state.
- Sessions: list, create, update, delete, fork, abort, share, and open sessions.
- Chat: list messages, send prompts, execute slash commands, show streaming updates.
- Files: browse project files and read file content.
- Diff: show session diff using `/session/:id/diff`.
- Permissions: display pending permission requests and send allow/deny responses.

## User flows

### Connect

User enters server URL and optional Basic Auth credentials. The app calls `/global/health`. On success, credentials are saved and the app opens the project/session view.

Recommended server command:

```bash
OPENCODE_SERVER_PASSWORD=your-password opencode serve --hostname 0.0.0.0 --port 4096
```

### Sessions and chat

The app lists sessions from `/session`. User can open a session, view messages, send a prompt through `/session/:id/prompt_async` or `/session/:id/message`, and watch updates through SSE.

### Files

The app lists files through `/file` and reads selected file content through `/file/content?path=<path>`. Initial version is read-only.

### Diff

The app opens session diff through `/session/:id/diff` and displays changed files plus hunks in a mobile-friendly view.

### Permissions

The app watches events for permission requests. Pending requests appear as blocking cards with approve/deny actions. Responses use `/session/:id/permissions/:permissionID`.

## Security

The app must treat remote control of opencode as high risk.

Requirements:

- Require Basic Auth for saved remote connections unless user explicitly marks a local trusted server.
- Store passwords in secure storage, not plain AsyncStorage.
- Warn users not to expose `opencode serve` directly to the public internet without HTTPS, VPN, Tailscale, Cloudflare Tunnel access controls, or equivalent protection.
- Never log credentials or full Authorization headers.

## Error handling

- Connection failures show retry and edit-connection actions.
- Authentication failures clear only the failed session token/header state, not saved credentials unless user chooses.
- SSE disconnects use backoff reconnect.
- Unsupported API responses show raw status and endpoint for debugging.

## Testing

- Unit-test opencode client request construction and auth header handling.
- Unit-test event parsing and reconnect state.
- Add integration tests against a mocked HTTP/SSE server.
- Keep server-side opencode tests unchanged.

## Open question

Running opencode locally on Android may be possible through Termux or similar environments, but it is not the recommended first target. Risk areas include Bun support, native dependencies, `node-pty`, tree-sitter packages, file watchers, SQLite behavior, shell assumptions, and Android filesystem/process constraints.
