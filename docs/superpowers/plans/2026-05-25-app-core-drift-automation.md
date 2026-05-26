# App Core Drift Automation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `@opencode-ai/app-core` and automation that keeps mobile workflow logic aligned with web app changes.

**Architecture:** Move mobile-safe opencode client workflows into `packages/app-core`, then make `packages/mobile` consume that package. Add repo scripts that detect duplicated/direct workflow routes and generate sync reports for app/mobile drift.

**Tech Stack:** TypeScript, Bun workspace packages, Bun tests, `@opencode-ai/sdk`, repo scripts under `script/`.

---

## File Structure

Create:

- `packages/app-core/package.json` — workspace package manifest.
- `packages/app-core/tsconfig.json` — typecheck config.
- `packages/app-core/src/index.ts` — public exports.
- `packages/app-core/src/client/auth.ts` — shared Basic Auth and URL helpers.
- `packages/app-core/src/client/auth.test.ts` — auth tests.
- `packages/app-core/src/client/http.ts` — shared opencode HTTP workflow client.
- `packages/app-core/src/client/http.test.ts` — HTTP client tests.
- `packages/app-core/src/client/events.ts` — shared SSE parsing/request helpers.
- `packages/app-core/src/client/events.test.ts` — event tests.
- `packages/app-core/src/workflow/session.ts` — session/message workflow helpers.
- `packages/app-core/src/workflow/session.test.ts` — session workflow tests.
- `packages/app-core/src/workflow/file.ts` — file path and file read/list workflow helpers.
- `packages/app-core/src/workflow/file.test.ts` — file workflow tests.
- `packages/app-core/src/workflow/diff.ts` — diff summary helpers.
- `packages/app-core/src/workflow/diff.test.ts` — diff workflow tests.
- `packages/app-core/src/workflow/permission.ts` — permission reply mapping helpers.
- `packages/app-core/src/workflow/permission.test.ts` — permission workflow tests.
- `script/check-app-core-drift.ts` — hard drift check.
- `script/report-app-core-sync.ts` — markdown sync report generator.
- `script/app-core-drift-rules.ts` — shared drift rule definitions.
- `script/app-core-drift-rules.test.ts` — script unit tests.

Modify:

- `packages/mobile/package.json` — depend on `@opencode-ai/app-core`.
- `packages/mobile/src/client/auth.ts` — re-export or remove in favor of app-core.
- `packages/mobile/src/client/http.ts` — re-export or wrap app-core client.
- `packages/mobile/src/client/events.ts` — re-export or wrap app-core events.
- `packages/mobile/src/client/types.ts` — import app-core types.
- `packages/mobile/src/ui/FileScreen.tsx` — use app-core file helpers.
- `packages/mobile/src/ui/DiffScreen.tsx` — use app-core diff helpers.
- `package.json` — add scripts `check:app-core-drift` and `report:app-core-sync`.
- `turbo.json` — add drift check task only if repo convention needs it.

---

### Task 1: Create app-core package scaffold

**Files:**
- Create: `packages/app-core/package.json`
- Create: `packages/app-core/tsconfig.json`
- Create: `packages/app-core/src/index.ts`

- [ ] **Step 1: Create package manifest**

Create `packages/app-core/package.json`:

```json
{
  "name": "@opencode-ai/app-core",
  "version": "1.15.10",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./client": "./src/client/http.ts",
    "./events": "./src/client/events.ts",
    "./workflow/session": "./src/workflow/session.ts",
    "./workflow/file": "./src/workflow/file.ts",
    "./workflow/diff": "./src/workflow/diff.ts",
    "./workflow/permission": "./src/workflow/permission.ts"
  },
  "scripts": {
    "typecheck": "tsgo --noEmit",
    "test": "bun test src"
  },
  "dependencies": {
    "@opencode-ai/sdk": "workspace:*"
  },
  "devDependencies": {
    "@types/bun": "catalog:",
    "@typescript/native-preview": "catalog:",
    "typescript": "catalog:"
  }
}
```

- [ ] **Step 2: Create TypeScript config**

Create `packages/app-core/tsconfig.json`:

```json
{
  "extends": "@tsconfig/bun/tsconfig.json",
  "compilerOptions": {
    "types": ["bun-types"]
  },
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 3: Create public exports**

Create `packages/app-core/src/index.ts`:

```ts
export * from "./client/auth"
export * from "./client/http"
export * from "./client/events"
export * from "./workflow/session"
export * from "./workflow/file"
export * from "./workflow/diff"
export * from "./workflow/permission"
```

- [ ] **Step 4: Run typecheck**

Run from `packages/app-core`:

```bash
bun typecheck
```

Expected: PASS, or `bun: command not found` if local environment lacks Bun.

- [ ] **Step 5: Commit**

```bash
git add packages/app-core
git commit -m "feat(app-core): scaffold shared workflow package"
```

---

### Task 2: Move shared client auth and HTTP workflows

**Files:**
- Create: `packages/app-core/src/client/auth.ts`
- Create: `packages/app-core/src/client/auth.test.ts`
- Create: `packages/app-core/src/client/http.ts`
- Create: `packages/app-core/src/client/http.test.ts`
- Modify: `packages/mobile/package.json`
- Modify: `packages/mobile/src/client/auth.ts`
- Modify: `packages/mobile/src/client/http.ts`
- Modify: `packages/mobile/src/client/types.ts`

- [ ] **Step 1: Write app-core auth tests**

Create `packages/app-core/src/client/auth.test.ts`:

```ts
import { describe, expect, test } from "bun:test"
import { buildAuthHeaders, normalizeServerUrl } from "./auth"

describe("normalizeServerUrl", () => {
  test("trims and removes trailing slashes", () => {
    expect(normalizeServerUrl("  http://localhost:4096/// ")).toBe("http://localhost:4096")
  })
})

describe("buildAuthHeaders", () => {
  test("returns empty object without password", () => {
    expect(buildAuthHeaders({ username: "opencode", password: "" })).toEqual({})
  })

  test("builds default username basic auth", () => {
    expect(buildAuthHeaders({ password: "secret" })).toEqual({ Authorization: "Basic b3BlbmNvZGU6c2VjcmV0" })
  })
})
```

- [ ] **Step 2: Run failing auth tests**

Run from `packages/app-core`:

```bash
bun test src/client/auth.test.ts
```

Expected: FAIL because `src/client/auth.ts` does not exist.

- [ ] **Step 3: Implement auth helper**

Create `packages/app-core/src/client/auth.ts`:

```ts
export type Connection = {
  url: string
  username?: string
  password?: string
  trustedLocal?: boolean
}

export function normalizeServerUrl(value: string) {
  return value.trim().replace(/\/+$/, "")
}

export function buildAuthHeaders(input: { username?: string; password?: string }) {
  if (!input.password) return {}
  return { Authorization: `Basic ${encodeBasicAuth(input.username || "opencode", input.password)}` }
}

function encodeBasicAuth(username: string, password: string) {
  if (typeof btoa === "function") return btoa(`${username}:${password}`)
  return Buffer.from(`${username}:${password}`, "utf8").toString("base64")
}
```

- [ ] **Step 4: Write HTTP tests**

Create `packages/app-core/src/client/http.test.ts`:

```ts
import { describe, expect, test } from "bun:test"
import { createOpencodeHttpClient } from "./http"

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  })
}

describe("createOpencodeHttpClient", () => {
  test("calls health endpoint", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = []
    const client = createOpencodeHttpClient({ url: "http://localhost:4096/" }, async (url, init) => {
      calls.push({ url, init })
      return jsonResponse({ healthy: true, version: "1.0.0" })
    })

    expect(await client.health()).toEqual({ healthy: true, version: "1.0.0" })
    expect(calls[0].url).toBe("http://localhost:4096/global/health")
  })

  test("uses current permission reply endpoint", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = []
    const client = createOpencodeHttpClient({ url: "http://localhost:4096" }, async (url, init) => {
      calls.push({ url, init })
      return jsonResponse(true)
    })

    expect(await client.respondPermission("req_1", "once")).toBe(true)
    expect(calls[0].url).toBe("http://localhost:4096/permission/req_1/reply")
    expect(calls[0].init?.body).toBe(JSON.stringify({ reply: "once" }))
  })
})
```

- [ ] **Step 5: Run failing HTTP tests**

Run from `packages/app-core`:

```bash
bun test src/client/http.test.ts
```

Expected: FAIL because `src/client/http.ts` does not exist.

- [ ] **Step 6: Implement HTTP client**

Create `packages/app-core/src/client/http.ts`:

```ts
import type { FileContent, FileDiff, FileNode, Session } from "@opencode-ai/sdk/client"
import { buildAuthHeaders, type Connection, normalizeServerUrl } from "./auth"

export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>

export type Health = {
  healthy: true
  version: string
}

export type SessionMessage = {
  info: {
    id: string
    sessionID: string
    role: string
    time: { created: number }
  }
  parts: Array<{ id?: string; type: string; text?: string; [key: string]: unknown }>
}

export type PermissionReply = "once" | "always" | "reject"

export type OpencodeApi = {
  health(): Promise<Health>
  listSessions(): Promise<Session[]>
  createSession(title?: string): Promise<Session>
  listMessages(sessionID: string): Promise<SessionMessage[]>
  sendPrompt(sessionID: string, text: string): Promise<void>
  listFiles(path?: string): Promise<FileNode[]>
  readFile(path: string): Promise<FileContent>
  getDiff(sessionID: string): Promise<FileDiff[]>
  respondPermission(requestID: string, reply: PermissionReply): Promise<boolean>
}

export function createOpencodeHttpClient(connection: Connection, fetcher: FetchLike = fetch): OpencodeApi {
  const base = normalizeServerUrl(connection.url)

  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const response = await fetcher(`${base}${path}`, {
      method,
      headers: {
        accept: "application/json",
        ...(body === undefined ? {} : { "content-type": "application/json" }),
        ...buildAuthHeaders(connection),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    if (!response.ok) throw new Error(`${method} ${path} failed with ${response.status}`)
    if (response.status === 204) return undefined as T
    return response.json() as Promise<T>
  }

  return {
    health: () => request("GET", "/global/health"),
    listSessions: () => request("GET", "/session"),
    createSession: (title) => request("POST", "/session", title ? { title } : {}),
    listMessages: (sessionID) => request("GET", `/session/${encodeURIComponent(sessionID)}/message`),
    sendPrompt: (sessionID, text) =>
      request("POST", `/session/${encodeURIComponent(sessionID)}/prompt_async`, {
        parts: [{ type: "text", text }],
      }),
    listFiles: (path = ".") => request("GET", `/file?path=${encodeURIComponent(path)}`),
    readFile: (path) => request("GET", `/file/content?path=${encodeURIComponent(path)}`),
    getDiff: (sessionID) => request("GET", `/session/${encodeURIComponent(sessionID)}/diff`),
    respondPermission: (requestID, reply) => request("POST", `/permission/${encodeURIComponent(requestID)}/reply`, { reply }),
  }
}
```

- [ ] **Step 7: Point mobile to app-core client**

Modify `packages/mobile/package.json` dependencies:

```json
"@opencode-ai/app-core": "workspace:*",
"@opencode-ai/sdk": "workspace:*",
```

Replace `packages/mobile/src/client/auth.ts` with:

```ts
export { buildAuthHeaders, normalizeServerUrl } from "@opencode-ai/app-core"
```

Replace `packages/mobile/src/client/http.ts` with:

```ts
export { createOpencodeHttpClient } from "@opencode-ai/app-core"
```

Replace `packages/mobile/src/client/types.ts` with:

```ts
export type { Connection, Health, OpencodeApi, PermissionReply, SessionMessage } from "@opencode-ai/app-core"

export type PermissionRequest = {
  sessionID: string
  requestID: string
  title: string
  metadata?: unknown
}
```

- [ ] **Step 8: Run tests**

Run:

```bash
cd packages/app-core && bun test src/client && bun typecheck
cd ../mobile && bun test src/client && bun typecheck
```

Expected: PASS, or `bun: command not found` if local environment lacks Bun.

- [ ] **Step 9: Commit**

```bash
git add packages/app-core packages/mobile/package.json packages/mobile/src/client
git commit -m "feat(app-core): share opencode client workflows"
```

---

### Task 3: Move shared event workflows

**Files:**
- Create: `packages/app-core/src/client/events.ts`
- Create: `packages/app-core/src/client/events.test.ts`
- Modify: `packages/mobile/src/client/events.ts`

- [ ] **Step 1: Write event tests**

Create `packages/app-core/src/client/events.test.ts`:

```ts
import { describe, expect, test } from "bun:test"
import { createEventRequest, createSseParser, getReconnectDelay, parseSseChunk } from "./events"

describe("parseSseChunk", () => {
  test("parses complete json event", () => {
    expect(parseSseChunk('event: message\ndata: {"type":"server.connected"}\n\n')).toEqual([
      { event: "message", data: { type: "server.connected" } },
    ])
  })

  test("supports crlf frames", () => {
    expect(parseSseChunk('data: {"type":"a"}\r\n\r\ndata: {"type":"b"}\r\n\r\n')).toEqual([
      { event: "message", data: { type: "a" } },
      { event: "message", data: { type: "b" } },
    ])
  })

  test("buffers partial frames", () => {
    const parser = createSseParser()
    expect(parser.push('data: {"type"')).toEqual([])
    expect(parser.push(':"done"}\n\n')).toEqual([{ event: "message", data: { type: "done" } }])
  })
})

describe("createEventRequest", () => {
  test("creates authenticated event request", () => {
    const request = createEventRequest({ url: "http://localhost:4096", password: "secret" })
    expect(request.url).toBe("http://localhost:4096/event")
    expect(request.headers.get("accept")).toBe("text/event-stream")
    expect(request.headers.get("authorization")).toBe("Basic b3BlbmNvZGU6c2VjcmV0")
  })
})

describe("getReconnectDelay", () => {
  test("caps backoff", () => {
    expect(getReconnectDelay(0)).toBe(500)
    expect(getReconnectDelay(20)).toBe(10000)
  })
})
```

- [ ] **Step 2: Run failing tests**

Run from `packages/app-core`:

```bash
bun test src/client/events.test.ts
```

Expected: FAIL because `src/client/events.ts` does not exist.

- [ ] **Step 3: Implement app-core events**

Create `packages/app-core/src/client/events.ts` by moving the current tested behavior from `packages/mobile/src/client/events.ts`. The file must export:

```ts
export type SseMessage = { event: string; data: unknown }
export function parseSseChunk(chunk: string): SseMessage[]
export function createSseParser(): { push(chunk: string): SseMessage[]; flush(): SseMessage[] }
export function getReconnectDelay(attempt: number): number
export function createEventRequest(connection: Connection, path?: string): Request
```

Use `buildAuthHeaders` and `normalizeServerUrl` from `./auth`.

- [ ] **Step 4: Re-export mobile events**

Replace `packages/mobile/src/client/events.ts` with:

```ts
export { createEventRequest, createSseParser, getReconnectDelay, parseSseChunk } from "@opencode-ai/app-core"
export type { SseMessage } from "@opencode-ai/app-core"
```

- [ ] **Step 5: Run tests**

Run:

```bash
cd packages/app-core && bun test src/client/events.test.ts && bun typecheck
cd ../mobile && bun test src/client/events.test.ts && bun typecheck
```

Expected: PASS, or `bun: command not found` if local environment lacks Bun.

- [ ] **Step 6: Commit**

```bash
git add packages/app-core/src/client/events.ts packages/app-core/src/client/events.test.ts packages/mobile/src/client/events.ts
git commit -m "feat(app-core): share event stream workflow"
```

---

### Task 4: Add shared session, file, diff, and permission workflow helpers

**Files:**
- Create: `packages/app-core/src/workflow/session.ts`
- Create: `packages/app-core/src/workflow/session.test.ts`
- Create: `packages/app-core/src/workflow/file.ts`
- Create: `packages/app-core/src/workflow/file.test.ts`
- Create: `packages/app-core/src/workflow/diff.ts`
- Create: `packages/app-core/src/workflow/diff.test.ts`
- Create: `packages/app-core/src/workflow/permission.ts`
- Create: `packages/app-core/src/workflow/permission.test.ts`
- Modify: `packages/mobile/src/ui/FileScreen.tsx`
- Modify: `packages/mobile/src/ui/DiffScreen.tsx`
- Modify: `packages/mobile/src/ui/PermissionBanner.tsx`

- [ ] **Step 1: Write file workflow tests**

Create `packages/app-core/src/workflow/file.test.ts`:

```ts
import { describe, expect, test } from "bun:test"
import { getParentPath, isDirectoryNode } from "./file"

describe("getParentPath", () => {
  test("handles slash paths", () => {
    expect(getParentPath("src/foo/bar.ts")).toBe("src/foo")
  })

  test("handles windows paths", () => {
    expect(getParentPath("src\\foo\\bar.ts")).toBe("src\\foo")
  })

  test("returns dot at root", () => {
    expect(getParentPath("foo.ts")).toBe(".")
  })
})

describe("isDirectoryNode", () => {
  test("detects directory shapes", () => {
    expect(isDirectoryNode({ type: "directory" })).toBe(true)
    expect(isDirectoryNode({ isDirectory: true })).toBe(true)
    expect(isDirectoryNode({ type: "file" })).toBe(false)
  })
})
```

- [ ] **Step 2: Implement file workflow**

Create `packages/app-core/src/workflow/file.ts`:

```ts
export function getParentPath(value: string) {
  const index = Math.max(value.lastIndexOf("/"), value.lastIndexOf("\\"))
  if (index <= 0) return "."
  return value.slice(0, index)
}

export function isDirectoryNode(node: unknown) {
  if (!node || typeof node !== "object") return false
  const value = node as { type?: unknown; isDirectory?: unknown }
  return value.type === "directory" || value.isDirectory === true
}
```

- [ ] **Step 3: Write diff workflow tests**

Create `packages/app-core/src/workflow/diff.test.ts`:

```ts
import { describe, expect, test } from "bun:test"
import { summarizeDiff } from "./diff"

describe("summarizeDiff", () => {
  test("formats additions and deletions", () => {
    expect(summarizeDiff({ file: "a.ts", additions: 3, deletions: 2 })).toBe("+3 -2")
  })
})
```

- [ ] **Step 4: Implement diff workflow**

Create `packages/app-core/src/workflow/diff.ts`:

```ts
export function summarizeDiff(diff: { additions: number; deletions: number }) {
  return `+${diff.additions} -${diff.deletions}`
}
```

- [ ] **Step 5: Write permission workflow tests**

Create `packages/app-core/src/workflow/permission.test.ts`:

```ts
import { describe, expect, test } from "bun:test"
import { mapPermissionButtonToReply } from "./permission"

describe("mapPermissionButtonToReply", () => {
  test("maps allow once", () => {
    expect(mapPermissionButtonToReply("allow")).toBe("once")
  })

  test("maps deny", () => {
    expect(mapPermissionButtonToReply("deny")).toBe("reject")
  })
})
```

- [ ] **Step 6: Implement permission workflow**

Create `packages/app-core/src/workflow/permission.ts`:

```ts
import type { PermissionReply } from "../client/http"

export type PermissionButton = "allow" | "always" | "deny"

export function mapPermissionButtonToReply(button: PermissionButton): PermissionReply {
  if (button === "allow") return "once"
  if (button === "always") return "always"
  return "reject"
}
```

- [ ] **Step 7: Write session workflow tests**

Create `packages/app-core/src/workflow/session.test.ts`:

```ts
import { describe, expect, test } from "bun:test"
import { getMessageText } from "./session"

describe("getMessageText", () => {
  test("joins text parts", () => {
    expect(getMessageText({ parts: [{ type: "text", text: "a" }, { type: "text", text: "b" }] })).toBe("a\nb")
  })

  test("falls back to role", () => {
    expect(getMessageText({ info: { role: "assistant" }, parts: [] })).toBe("assistant")
  })
})
```

- [ ] **Step 8: Implement session workflow**

Create `packages/app-core/src/workflow/session.ts`:

```ts
export function getMessageText(message: { info?: { role?: string }; parts: Array<{ text?: string }> }) {
  return message.parts.map((part) => part.text).filter(Boolean).join("\n") || message.info?.role || "message"
}
```

- [ ] **Step 9: Use helpers in mobile UI**

Modify mobile files:

- `packages/mobile/src/ui/FileScreen.tsx` imports `getParentPath` and `isDirectoryNode` from `@opencode-ai/app-core`.
- `packages/mobile/src/ui/DiffScreen.tsx` imports `summarizeDiff` from `@opencode-ai/app-core`.
- `packages/mobile/src/ui/PermissionBanner.tsx` imports `mapPermissionButtonToReply` from `@opencode-ai/app-core` and emits `PermissionReply`.

- [ ] **Step 10: Run tests**

Run:

```bash
cd packages/app-core && bun test src/workflow && bun typecheck
cd ../mobile && bun typecheck
```

Expected: PASS, or `bun: command not found` if local environment lacks Bun.

- [ ] **Step 11: Commit**

```bash
git add packages/app-core/src/workflow packages/mobile/src/ui
git commit -m "feat(app-core): share mobile workflow helpers"
```

---

### Task 5: Add drift rule engine and hard check script

**Files:**
- Create: `script/app-core-drift-rules.ts`
- Create: `script/app-core-drift-rules.test.ts`
- Create: `script/check-app-core-drift.ts`
- Modify: `package.json`

- [ ] **Step 1: Write drift rule tests**

Create `script/app-core-drift-rules.test.ts`:

```ts
import { describe, expect, test } from "bun:test"
import { findEndpointStrings, findForbiddenDirectRoutes } from "./app-core-drift-rules"

describe("findEndpointStrings", () => {
  test("finds opencode endpoint strings", () => {
    expect(findEndpointStrings('request("GET", "/session")\nfetch("/file?path=.")')).toEqual(["/session", "/file?path=."])
  })
})

describe("findForbiddenDirectRoutes", () => {
  test("flags mobile duplicate route", () => {
    expect(findForbiddenDirectRoutes("packages/mobile/src/client/http.ts", 'request("GET", "/session")')).toEqual([
      { file: "packages/mobile/src/client/http.ts", endpoint: "/session", reason: "mobile workflow route should come from @opencode-ai/app-core" },
    ])
  })

  test("allows app-core route owner", () => {
    expect(findForbiddenDirectRoutes("packages/app-core/src/client/http.ts", 'request("GET", "/session")')).toEqual([])
  })
})
```

- [ ] **Step 2: Implement drift rules**

Create `script/app-core-drift-rules.ts`:

```ts
export type DriftIssue = {
  file: string
  endpoint: string
  reason: string
}

const ownedEndpoints = [
  "/global/health",
  "/session",
  "/message",
  "/prompt_async",
  "/file",
  "/file/content",
  "/diff",
  "/permission/",
]

export function findEndpointStrings(content: string) {
  return Array.from(content.matchAll(/["'`]((?:\/[a-z][^"'`\s]*)+)["'`]/g))
    .map((match) => match[1])
    .filter((value) => ownedEndpoints.some((endpoint) => value.includes(endpoint)))
}

export function findForbiddenDirectRoutes(file: string, content: string): DriftIssue[] {
  if (file.includes("packages/app-core/")) return []
  if (!file.includes("packages/mobile/") && !file.includes("packages/app/src/pages/session") && !file.includes("packages/app/src/utils")) return []
  return findEndpointStrings(content).map((endpoint) => ({
    file,
    endpoint,
    reason: file.includes("packages/mobile/")
      ? "mobile workflow route should come from @opencode-ai/app-core"
      : "app workflow route should move to @opencode-ai/app-core or be documented as UI-only",
  }))
}
```

- [ ] **Step 3: Write check script**

Create `script/check-app-core-drift.ts`:

```ts
import { Glob } from "bun"
import { findForbiddenDirectRoutes } from "./app-core-drift-rules"

const files = [
  ...new Glob("packages/mobile/src/**/*.{ts,tsx}").scanSync("."),
  ...new Glob("packages/app/src/pages/session/**/*.{ts,tsx}").scanSync("."),
  ...new Glob("packages/app/src/utils/*.{ts,tsx}").scanSync("."),
]

const issues = files.flatMap((file) => findForbiddenDirectRoutes(file, Bun.file(file).textSync()))

if (issues.length) {
  console.error("app-core drift check failed")
  for (const issue of issues) console.error(`${issue.file}: ${issue.endpoint} - ${issue.reason}`)
  process.exit(1)
}

console.log("app-core drift check passed")
```

- [ ] **Step 4: Add root script**

Modify root `package.json` scripts:

```json
"check:app-core-drift": "bun run script/check-app-core-drift.ts"
```

- [ ] **Step 5: Run tests and check**

Run from root:

```bash
bun test script/app-core-drift-rules.test.ts
bun run check:app-core-drift
```

Expected: tests PASS. Drift check may fail because current app direct routes are not migrated; if it fails, add an allowlist comment format in rules and document initial web allowlist, then make it pass only for documented web routes.

- [ ] **Step 6: Commit**

```bash
git add script/app-core-drift-rules.ts script/app-core-drift-rules.test.ts script/check-app-core-drift.ts package.json
git commit -m "feat(app-core): add drift check"
```

---

### Task 6: Add sync report script

**Files:**
- Create: `script/report-app-core-sync.ts`
- Modify: `package.json`

- [ ] **Step 1: Create sync report script**

Create `script/report-app-core-sync.ts`:

```ts
import { Glob } from "bun"
import { findEndpointStrings } from "./app-core-drift-rules"

const base = process.argv[2] || "origin/dev"
const changed = new Set(
  await new Response(Bun.spawnSync(["git", "diff", "--name-only", `${base}...HEAD`]).stdout).text().then((value) => value.split("\n").filter(Boolean)),
)

const watched = Array.from(changed).filter(
  (file) => file.startsWith("packages/app/src/pages/session/") || file.startsWith("packages/app/src/utils/") || file.startsWith("packages/mobile/src/") || file.startsWith("packages/app-core/src/"),
)

const allWatched = [
  ...new Glob("packages/app/src/pages/session/**/*.{ts,tsx}").scanSync("."),
  ...new Glob("packages/app/src/utils/*.{ts,tsx}").scanSync("."),
  ...new Glob("packages/mobile/src/**/*.{ts,tsx}").scanSync("."),
  ...new Glob("packages/app-core/src/**/*.ts").scanSync("."),
]

const endpoints = allWatched.flatMap((file) => findEndpointStrings(Bun.file(file).textSync()).map((endpoint) => ({ file, endpoint })))

console.log("# app-core sync report")
console.log("")
console.log(`Base: ${base}`)
console.log("")
console.log("## Changed watched files")
for (const file of watched) console.log(`- ${file}`)
if (!watched.length) console.log("- none")
console.log("")
console.log("## Observed endpoint strings")
for (const item of endpoints) console.log(`- ${item.endpoint} in ${item.file}`)
if (!endpoints.length) console.log("- none")
console.log("")
console.log("## Review targets")
console.log("- packages/app-core/src/client")
console.log("- packages/app-core/src/workflow")
console.log("- packages/mobile/src/client")
console.log("- packages/mobile/src/ui")
```

- [ ] **Step 2: Add root script**

Modify root `package.json` scripts:

```json
"report:app-core-sync": "bun run script/report-app-core-sync.ts"
```

- [ ] **Step 3: Run report**

Run from root:

```bash
bun run report:app-core-sync origin/dev
```

Expected: markdown report printed.

- [ ] **Step 4: Commit**

```bash
git add script/report-app-core-sync.ts package.json
git commit -m "feat(app-core): add sync report"
```

---

### Task 7: Verification and documentation update

**Files:**
- Create: `packages/app-core/README.md`
- Modify: `packages/mobile/README.md`
- Modify: `docs/superpowers/specs/2026-05-25-app-core-drift-automation-design.md`

- [ ] **Step 1: Add app-core README**

Create `packages/app-core/README.md`:

```md
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
```

- [ ] **Step 2: Update mobile README**

Add this section to `packages/mobile/README.md`:

```md
## Shared workflows

Mobile imports shared opencode workflow logic from `@opencode-ai/app-core`. UI and navigation stay in React Native; server route wrappers, event parsing, and cross-platform helpers belong in `app-core`.

When changing session, file, diff, or permission workflows, run:

```bash
bun run check:app-core-drift
bun run report:app-core-sync origin/dev
```
```

- [ ] **Step 3: Update design spec with implementation decision**

Append to `docs/superpowers/specs/2026-05-25-app-core-drift-automation-design.md`:

```md
## Implementation note

Initial implementation migrates mobile client/event/helper logic first. Web adoption starts by enforcing drift visibility around `packages/app/src/pages/session` and `packages/app/src/utils`; direct web routes can remain only when documented as UI-specific or intentionally not part of `app-core` yet.
```

- [ ] **Step 4: Run verification**

Run:

```bash
cd packages/app-core && bun test src && bun typecheck
cd ../mobile && bun test src && bun typecheck
cd ../.. && bun run check:app-core-drift && bun run lint && bun run typecheck
```

Expected: PASS, or `bun: command not found` if local environment lacks Bun.

- [ ] **Step 5: Commit**

```bash
git add packages/app-core/README.md packages/mobile/README.md docs/superpowers/specs/2026-05-25-app-core-drift-automation-design.md
git commit -m "docs(app-core): document drift workflow"
```

---

## Self-Review

Spec coverage:

- `packages/app-core` package exists: Task 1.
- Shared HTTP/event/session/file/diff/permission workflows: Tasks 2-4.
- Mobile consumes `app-core`: Tasks 2-4.
- Drift hard check: Task 5.
- Sync report: Task 6.
- Documentation and workflow instructions: Task 7.

Placeholder scan: no placeholder tasks remain; each code step contains concrete content.

Type consistency: `Connection`, `OpencodeApi`, `PermissionReply`, `SseMessage`, and workflow helper names are defined before use and reused consistently.
