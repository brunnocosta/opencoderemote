# app-core

Shared workflow logic for opencode web and mobile clients.

This package may contain HTTP client wrappers, event parsing, and workflow helpers that do not depend on SolidJS, React, React Native, Expo, or DOM-only APIs.

## Commands

```bash
bun test src
bun typecheck
```

## Drift automation

From the repo root:

```bash
bun run check:app-core-drift
bun run report:app-core-sync origin/dev
```
