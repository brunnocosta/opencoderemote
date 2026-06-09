# Mobile Shell Robustness and UX Design

## Scope

Only files under `packages/mobile` may change. The mobile app remains an Expo/React Native Android shell that loads the existing bundled web UI in a WebView. No changes are planned for `packages/app`, `packages/app-core`, or server packages.

## Goals

- Improve the native connection experience.
- Keep password optional.
- Allow users to test a server connection before opening the WebView, while still allowing them to continue if the check fails.
- Make the saved server editable without automatically deleting it.
- Split `App.tsx` into smaller mobile-only modules with clear responsibilities.
- Add tests for mobile shell rules that do not require Android runtime execution.

## Non-goals

- Rebuilding the opencode product UI in React Native.
- Changing the bundled web app contract in `packages/app`.
- Moving shared logic to `packages/app-core`.
- Requiring successful health checks before opening the WebView.

## Architecture

`App.tsx` becomes a small orchestrator. Mobile-specific behavior moves into focused modules under `packages/mobile/src`:

- Connection normalization, parsing, validation, and form model.
- Optional health check with injected `fetch` for tests.
- Secure connection persistence through the existing SecureStore adapter.
- WebView bridge injection string generation.
- Navigation policy for bundled asset URLs and external links.
- Back/toggle-server policy that can be tested without React Native.
- Native screens for loading, connection setup, and WebView chrome.

The WebView still loads `file:///android_asset/opencode-web/index.html#/` and injects the same `window.__OPENCODE__.mobile.server` shape expected by the bundled web UI.

## UX

The connection screen is redesigned within the existing dark opencode style. It includes:

- Server URL field.
- Username field defaulting to `opencode`.
- Password field clearly marked optional.
- Primary action to open opencode.
- Connection test status and friendly error messages.
- A continue option when the health check fails.

When a connection is already saved, users can reach the connection screen from a native action while the WebView is open. The screen is prefilled with the saved values. Editing and reconnecting updates SecureStore. A separate “forget server” action clears the saved connection; switching servers does not clear data automatically.

## Data Flow

1. On launch, the app loads the saved connection from SecureStore.
2. If no connection exists, it shows the connection screen.
3. When the user submits, the app normalizes the URL and optional credentials.
4. The app attempts a health check.
5. If the check succeeds, it saves the connection and opens the WebView.
6. If the check fails, it shows the error and allows the user to continue anyway.
7. The WebView receives the saved connection through the generated injection script.
8. The native “change server” action returns to the connection screen with current values intact.
9. The “forget server” action deletes the stored connection and clears the form.

## Error Handling

- Empty URL remains a blocking validation error.
- Invalid or unreadable stored connection data is ignored.
- Health check failures are non-blocking and shown as actionable feedback.
- WebView asset/load failures return to the connection screen with the current connection still available for editing.
- External HTTP and HTTPS links open through React Native Linking and do not navigate inside the bundled WebView.

## Testing

Mobile tests run from `packages/mobile` with `bun test src`. Type checking runs with `bun typecheck`.

Tests should cover:

- URL normalization and optional password handling.
- Connection parsing and invalid stored values.
- Health check success, failure, auth header behavior, and injected fetch behavior.
- WebView bridge injection serialization.
- Navigation policy for bundled assets and external links.
- Back and change-server policy.
- Build asset script guard where existing tests apply.

## Acceptance Criteria

- All changes stay under `packages/mobile`.
- Password remains optional in UI, normalization, storage, and health check behavior.
- Users can continue after a failed health check.
- Users can return to the connection screen with existing connection values prefilled.
- Saved connection is not cleared unless the user chooses “forget server”.
- `App.tsx` is smaller and delegates mobile-specific rules to tested modules.
- `bun test src` and `bun typecheck` pass in `packages/mobile`.
