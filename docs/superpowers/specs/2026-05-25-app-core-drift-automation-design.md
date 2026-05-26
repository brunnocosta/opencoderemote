# Shared app core and mobile drift automation

## Goal

Keep `packages/mobile` aligned with `packages/app` without sharing UI code. Web keeps SolidJS UI, mobile keeps React Native UI, and shared workflow logic moves behind a TypeScript module used by both.

## Non-goals

- Run SolidJS UI directly in React Native.
- Replace mobile UI with a WebView wrapper.
- Migrate all `packages/app` logic in one change.

## Architecture

Create `packages/app-core` as the shared Module for client and workflow logic that is independent of rendering runtime.

Initial shared areas:

- opencode HTTP client wrappers
- event stream parsing and routing helpers
- session list/detail/message operations
- file browsing helpers
- diff loading helpers
- permission request/reply helpers

`packages/app` and `packages/mobile` should import from `@opencode-ai/app-core` for these workflows. UI-specific state, SolidJS resources, React hooks, styles, navigation, and rendering stay in their packages.

## Drift automation

Add scripts that make drift visible when web changes without corresponding core/mobile awareness.

### Drift check

A script compares key API usage and route/workflow ownership across `packages/app`, `packages/mobile`, and `packages/app-core`.

It should fail when:

- `packages/app` calls opencode server routes directly for a workflow that is supposed to be owned by `app-core`.
- `packages/mobile` duplicates an `app-core` workflow instead of importing it.
- `@opencode-ai/sdk` generated route/type names change and `app-core` has no matching update.

### Sync report

A script generates a markdown report listing:

- changed files under `packages/app/src/pages/session` and `packages/app/src/utils`
- matching `app-core` modules that may need updates
- matching `mobile` screens/client modules that may need updates
- newly observed server endpoint strings

The report is advisory for local use and CI artifacts; the drift check is the hard gate.

## Workflow

1. Developer changes `packages/app` workflow logic.
2. If logic belongs in `app-core`, drift check fails until logic is moved or mirrored through `app-core`.
3. Sync report shows which mobile areas may need review.
4. Mobile UI only changes when shared workflow contract changed or new mobile presentation is needed.

## Testing

- Unit-test `app-core` workflow helpers without SolidJS or React Native.
- Keep existing `packages/app` tests for UI behavior.
- Keep `packages/mobile` tests for RN-specific state and screens.
- Add CI command for drift check.

## Package boundaries

`app-core` may depend on:

- `@opencode-ai/sdk`
- standard TypeScript/runtime APIs available in web and React Native

`app-core` must not depend on:

- `solid-js`
- `react`
- `react-native`
- DOM-only APIs without adapter injection
- Expo-specific storage or native modules

## Migration strategy

Start with mobile-owned client modules that overlap web workflows:

1. Move HTTP route wrappers and permission reply helpers into `app-core`.
2. Move event parsing/routing helpers into `app-core`.
3. Move file/diff/session helper functions into `app-core` as the web package touches those areas.
4. Replace direct mobile imports with `@opencode-ai/app-core`.
5. Add drift scripts and CI check after first shared modules exist.

## Success criteria

- New package `@opencode-ai/app-core` exists and is consumed by mobile.
- At least one web workflow uses `app-core` or has a documented migration seam.
- Drift check can fail CI for direct duplicated workflow usage.
- Sync report can be generated locally.

## Implementation note

Initial implementation migrates mobile client/event/helper logic first. Web adoption starts by enforcing drift visibility around `packages/app/src/pages/session` and `packages/app/src/utils`; direct web routes can remain only when documented as UI-specific or intentionally not part of `app-core` yet.
