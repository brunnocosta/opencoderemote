# Mobile Client Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an Expo React Native mobile client that connects to `opencode serve` and supports connections, sessions/chat, files, diffs, and permissions.

**Architecture:** Add `packages/mobile` as a workspace package. Keep the app client-only: server execution stays in `opencode serve`, while mobile owns secure connection storage, HTTP calls, SSE parsing, and focused screens for the supported workflows.

**Tech Stack:** Expo, React Native, TypeScript, Bun workspaces, `@opencode-ai/sdk` types, `expo-secure-store`, Bun tests for pure client/state modules.

---

## File Structure

Create:

- `packages/mobile/package.json` — Expo package scripts/dependencies.
- `packages/mobile/app.json` — Expo config for Android now and iOS later.
- `packages/mobile/tsconfig.json` — TypeScript config.
- `packages/mobile/babel.config.js` — Expo Babel config.
- `packages/mobile/App.tsx` — app shell and screen routing state.
- `packages/mobile/src/client/types.ts` — mobile-local connection/request/event types.
- `packages/mobile/src/client/auth.ts` — Basic Auth header construction.
- `packages/mobile/src/client/auth.test.ts` — auth unit tests.
- `packages/mobile/src/client/http.ts` — typed HTTP wrapper for opencode endpoints.
- `packages/mobile/src/client/http.test.ts` — request/error tests using fake fetch.
- `packages/mobile/src/client/events.ts` — SSE parsing and event-source adapter.
- `packages/mobile/src/client/events.test.ts` — SSE parser/reconnect state tests.
- `packages/mobile/src/storage/connection-store.ts` — SecureStore-backed connection persistence.
- `packages/mobile/src/storage/connection-store.test.ts` — storage tests with in-memory adapter.
- `packages/mobile/src/state/mobile-state.ts` — reducer for connection/session/message/file/diff/permission state.
- `packages/mobile/src/state/mobile-state.test.ts` — reducer tests.
- `packages/mobile/src/ui/theme.ts` — shared colors/spacing.
- `packages/mobile/src/ui/ConnectionScreen.tsx` — server URL/auth form.
- `packages/mobile/src/ui/HomeScreen.tsx` — project/session entry screen.
- `packages/mobile/src/ui/SessionScreen.tsx` — chat messages, composer, command entry.
- `packages/mobile/src/ui/FileScreen.tsx` — file browser and read-only content view.
- `packages/mobile/src/ui/DiffScreen.tsx` — changed files and hunk-like summary.
- `packages/mobile/src/ui/PermissionBanner.tsx` — pending permission cards.

Modify:

- `package.json` — workspace already includes `packages/*`; no workspace edit needed, but root scripts may add `dev:mobile` if desired.
- `turbo.json` — no required change for MVP; mobile package `typecheck` is enough for `bun turbo typecheck`.

Do not modify server APIs in this plan.

---

### Task 1: Package scaffold

**Files:**
- Create: `packages/mobile/package.json`
- Create: `packages/mobile/app.json`
- Create: `packages/mobile/tsconfig.json`
- Create: `packages/mobile/babel.config.js`
- Create: `packages/mobile/App.tsx`

- [ ] **Step 1: Create package manifest**

Create `packages/mobile/package.json`:

```json
{
  "name": "@opencode-ai/mobile",
  "version": "1.15.10",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "typecheck": "tsgo --noEmit",
    "test": "bun test src"
  },
  "dependencies": {
    "@opencode-ai/sdk": "workspace:*",
    "expo": "^54.0.0",
    "expo-secure-store": "^15.0.0",
    "react": "^19.0.0",
    "react-native": "^0.81.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@typescript/native-preview": "catalog:",
    "typescript": "catalog:"
  }
}
```

- [ ] **Step 2: Create Expo config**

Create `packages/mobile/app.json`:

```json
{
  "expo": {
    "name": "opencode",
    "slug": "opencode-mobile",
    "scheme": "opencode-mobile",
    "version": "1.15.10",
    "orientation": "portrait",
    "userInterfaceStyle": "automatic",
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "ai.opencode.mobile"
    },
    "android": {
      "package": "ai.opencode.mobile",
      "adaptiveIcon": {
        "backgroundColor": "#0b0f14"
      }
    },
    "plugins": ["expo-secure-store"]
  }
}
```

- [ ] **Step 3: Create TypeScript config**

Create `packages/mobile/tsconfig.json`:

```json
{
  "extends": "@tsconfig/bun/tsconfig.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "types": ["bun-types"]
  },
  "include": ["App.tsx", "src/**/*.ts", "src/**/*.tsx"]
}
```

- [ ] **Step 4: Create Babel config**

Create `packages/mobile/babel.config.js`:

```js
export default function (api) {
  api.cache(true)
  return {
    presets: ["babel-preset-expo"],
  }
}
```

- [ ] **Step 5: Create placeholder app shell**

Create `packages/mobile/App.tsx`:

```tsx
import { SafeAreaView, StatusBar, Text, View } from "react-native"

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b0f14" }}>
      <StatusBar barStyle="light-content" />
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Text style={{ color: "#f8fafc", fontSize: 28, fontWeight: "700" }}>opencode</Text>
        <Text style={{ color: "#94a3b8", marginTop: 8, textAlign: "center" }}>Mobile client scaffold</Text>
      </View>
    </SafeAreaView>
  )
}
```

- [ ] **Step 6: Run typecheck**

Run from `packages/mobile`:

```bash
bun typecheck
```

Expected: PASS, or dependency-install errors if Expo packages are not installed yet.

- [ ] **Step 7: Commit**

```bash
git add packages/mobile
git commit -m "feat(mobile): scaffold expo app"
```

---

### Task 2: Auth and HTTP client

**Files:**
- Create: `packages/mobile/src/client/types.ts`
- Create: `packages/mobile/src/client/auth.ts`
- Create: `packages/mobile/src/client/auth.test.ts`
- Create: `packages/mobile/src/client/http.ts`
- Create: `packages/mobile/src/client/http.test.ts`

- [ ] **Step 1: Write auth tests**

Create `packages/mobile/src/client/auth.test.ts`:

```ts
import { describe, expect, test } from "bun:test"
import { buildAuthHeaders, normalizeServerUrl } from "./auth"

describe("normalizeServerUrl", () => {
  test("removes trailing slash", () => {
    expect(normalizeServerUrl("http://localhost:4096/")).toBe("http://localhost:4096")
  })

  test("trims whitespace", () => {
    expect(normalizeServerUrl("  https://opencode.example.com  ")).toBe("https://opencode.example.com")
  })
})

describe("buildAuthHeaders", () => {
  test("returns empty headers without password", () => {
    expect(buildAuthHeaders({ username: "opencode", password: "" })).toEqual({})
  })

  test("builds basic auth header", () => {
    expect(buildAuthHeaders({ username: "opencode", password: "secret" })).toEqual({
      Authorization: "Basic b3BlbmNvZGU6c2VjcmV0",
    })
  })
})
```

- [ ] **Step 2: Run failing auth tests**

Run from `packages/mobile`:

```bash
bun test src/client/auth.test.ts
```

Expected: FAIL because `./auth` does not exist.

- [ ] **Step 3: Implement auth module**

Create `packages/mobile/src/client/auth.ts`:

```ts
export function normalizeServerUrl(value: string) {
  return value.trim().replace(/\/+$/, "")
}

export function buildAuthHeaders(input: { username?: string; password?: string }) {
  if (!input.password) return {}
  return {
    Authorization: `Basic ${btoa(`${input.username || "opencode"}:${input.password}`)}`,
  }
}
```

- [ ] **Step 4: Create shared types**

Create `packages/mobile/src/client/types.ts`:

```ts
import type { FileContent, FileDiff, FileNode, Session } from "@opencode-ai/sdk/client"

export type Connection = {
  url: string
  username?: string
  password?: string
  trustedLocal?: boolean
}

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

export type PermissionDecision = "allow" | "deny"

export type PermissionRequest = {
  sessionID: string
  permissionID: string
  title: string
  metadata?: unknown
}

export type OpencodeApi = {
  health(): Promise<Health>
  listSessions(): Promise<Session[]>
  createSession(title?: string): Promise<Session>
  listMessages(sessionID: string): Promise<SessionMessage[]>
  sendPrompt(sessionID: string, text: string): Promise<void>
  listFiles(path?: string): Promise<FileNode[]>
  readFile(path: string): Promise<FileContent>
  getDiff(sessionID: string): Promise<FileDiff[]>
  respondPermission(sessionID: string, permissionID: string, response: PermissionDecision): Promise<boolean>
}
```

- [ ] **Step 5: Write HTTP tests**

Create `packages/mobile/src/client/http.test.ts`:

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
  test("calls health endpoint with normalized base URL", async () => {
    const requests: Request[] = []
    const client = createOpencodeHttpClient(
      { url: "http://localhost:4096/" },
      async (request) => {
        requests.push(request)
        return jsonResponse({ healthy: true, version: "1.0.0" })
      },
    )

    expect(await client.health()).toEqual({ healthy: true, version: "1.0.0" })
    expect(requests[0].url).toBe("http://localhost:4096/global/health")
  })

  test("sends basic auth header", async () => {
    const requests: Request[] = []
    const client = createOpencodeHttpClient(
      { url: "http://localhost:4096", username: "opencode", password: "secret" },
      async (request) => {
        requests.push(request)
        return jsonResponse([])
      },
    )

    await client.listSessions()
    expect(requests[0].headers.get("authorization")).toBe("Basic b3BlbmNvZGU6c2VjcmV0")
  })

  test("throws status error", async () => {
    const client = createOpencodeHttpClient({ url: "http://localhost:4096" }, async () => jsonResponse({ error: "no" }, { status: 401 }))
    await expect(client.health()).rejects.toThrow("GET /global/health failed with 401")
  })
})
```

- [ ] **Step 6: Run failing HTTP tests**

Run from `packages/mobile`:

```bash
bun test src/client/http.test.ts
```

Expected: FAIL because `./http` does not exist.

- [ ] **Step 7: Implement HTTP client**

Create `packages/mobile/src/client/http.ts`:

```ts
import { buildAuthHeaders, normalizeServerUrl } from "./auth"
import type { Connection, OpencodeApi } from "./types"

export function createOpencodeHttpClient(connection: Connection, fetcher: typeof fetch = fetch): OpencodeApi {
  const base = normalizeServerUrl(connection.url)

  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const response = await fetcher(
      new Request(`${base}${path}`, {
        method,
        headers: {
          accept: "application/json",
          ...(body === undefined ? {} : { "content-type": "application/json" }),
          ...buildAuthHeaders(connection),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
    )
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
    respondPermission: (sessionID, permissionID, response) =>
      request("POST", `/session/${encodeURIComponent(sessionID)}/permissions/${encodeURIComponent(permissionID)}`, { response }),
  }
}
```

- [ ] **Step 8: Run tests**

Run from `packages/mobile`:

```bash
bun test src/client/auth.test.ts src/client/http.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add packages/mobile/src/client
git commit -m "feat(mobile): add opencode http client"
```

---

### Task 3: SSE event parsing

**Files:**
- Create: `packages/mobile/src/client/events.ts`
- Create: `packages/mobile/src/client/events.test.ts`

- [ ] **Step 1: Write event parser tests**

Create `packages/mobile/src/client/events.test.ts`:

```ts
import { describe, expect, test } from "bun:test"
import { getReconnectDelay, parseSseChunk } from "./events"

describe("parseSseChunk", () => {
  test("parses event and json data", () => {
    expect(parseSseChunk('event: message\ndata: {"type":"server.connected"}\n\n')).toEqual([
      { event: "message", data: { type: "server.connected" } },
    ])
  })

  test("ignores empty chunks", () => {
    expect(parseSseChunk("\n\n")).toEqual([])
  })

  test("keeps text data when json parse fails", () => {
    expect(parseSseChunk("data: hello\n\n")).toEqual([{ event: "message", data: "hello" }])
  })
})

describe("getReconnectDelay", () => {
  test("backs off to max delay", () => {
    expect(getReconnectDelay(0)).toBe(500)
    expect(getReconnectDelay(4)).toBe(8000)
    expect(getReconnectDelay(20)).toBe(10000)
  })
})
```

- [ ] **Step 2: Run failing tests**

Run from `packages/mobile`:

```bash
bun test src/client/events.test.ts
```

Expected: FAIL because `./events` does not exist.

- [ ] **Step 3: Implement event parser**

Create `packages/mobile/src/client/events.ts`:

```ts
import { buildAuthHeaders, normalizeServerUrl } from "./auth"
import type { Connection } from "./types"

export type SseMessage = {
  event: string
  data: unknown
}

export function parseSseChunk(chunk: string): SseMessage[] {
  return chunk
    .split("\n\n")
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block.split("\n")
      const event = lines.find((line) => line.startsWith("event:"))?.slice("event:".length).trim() || "message"
      const dataText = lines
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice("data:".length).trim())
        .join("\n")
      try {
        return { event, data: JSON.parse(dataText) }
      } catch {
        return { event, data: dataText }
      }
    })
}

export function getReconnectDelay(attempt: number) {
  return Math.min(500 * 2 ** attempt, 10000)
}

export function createEventRequest(connection: Connection, path = "/event") {
  return new Request(`${normalizeServerUrl(connection.url)}${path}`, {
    headers: {
      accept: "text/event-stream",
      ...buildAuthHeaders(connection),
    },
  })
}
```

- [ ] **Step 4: Run event tests**

Run from `packages/mobile`:

```bash
bun test src/client/events.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/mobile/src/client/events.ts packages/mobile/src/client/events.test.ts
git commit -m "feat(mobile): parse opencode event stream"
```

---

### Task 4: Secure connection storage

**Files:**
- Create: `packages/mobile/src/storage/connection-store.ts`
- Create: `packages/mobile/src/storage/connection-store.test.ts`

- [ ] **Step 1: Write storage tests**

Create `packages/mobile/src/storage/connection-store.test.ts`:

```ts
import { describe, expect, test } from "bun:test"
import { createConnectionStore } from "./connection-store"

describe("createConnectionStore", () => {
  test("saves and loads connection", async () => {
    const values = new Map<string, string>()
    const store = createConnectionStore({
      getItemAsync: async (key) => values.get(key) ?? null,
      setItemAsync: async (key, value) => void values.set(key, value),
      deleteItemAsync: async (key) => void values.delete(key),
    })

    await store.save({ url: "http://localhost:4096", username: "opencode", password: "secret" })
    expect(await store.load()).toEqual({ url: "http://localhost:4096", username: "opencode", password: "secret" })
  })

  test("returns undefined without saved connection", async () => {
    const store = createConnectionStore({
      getItemAsync: async () => null,
      setItemAsync: async () => undefined,
      deleteItemAsync: async () => undefined,
    })

    expect(await store.load()).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run failing tests**

Run from `packages/mobile`:

```bash
bun test src/storage/connection-store.test.ts
```

Expected: FAIL because `./connection-store` does not exist.

- [ ] **Step 3: Implement connection store**

Create `packages/mobile/src/storage/connection-store.ts`:

```ts
import * as SecureStore from "expo-secure-store"
import type { Connection } from "../client/types"

const key = "opencode.connection.v1"

export type SecureStorage = {
  getItemAsync(key: string): Promise<string | null>
  setItemAsync(key: string, value: string): Promise<void>
  deleteItemAsync(key: string): Promise<void>
}

export function createConnectionStore(storage: SecureStorage = SecureStore) {
  return {
    async load(): Promise<Connection | undefined> {
      const value = await storage.getItemAsync(key)
      if (!value) return
      return JSON.parse(value) as Connection
    },
    save(connection: Connection) {
      return storage.setItemAsync(key, JSON.stringify(connection))
    },
    clear() {
      return storage.deleteItemAsync(key)
    },
  }
}
```

- [ ] **Step 4: Run storage tests**

Run from `packages/mobile`:

```bash
bun test src/storage/connection-store.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/mobile/src/storage
git commit -m "feat(mobile): store server connection securely"
```

---

### Task 5: App state reducer

**Files:**
- Create: `packages/mobile/src/state/mobile-state.ts`
- Create: `packages/mobile/src/state/mobile-state.test.ts`

- [ ] **Step 1: Write reducer tests**

Create `packages/mobile/src/state/mobile-state.test.ts`:

```ts
import { describe, expect, test } from "bun:test"
import { initialMobileState, reduceMobileState } from "./mobile-state"

describe("reduceMobileState", () => {
  test("connects", () => {
    const state = reduceMobileState(initialMobileState, {
      type: "connected",
      connection: { url: "http://localhost:4096" },
      version: "1.0.0",
    })
    expect(state.connection?.url).toBe("http://localhost:4096")
    expect(state.version).toBe("1.0.0")
  })

  test("selects session", () => {
    const state = reduceMobileState(initialMobileState, { type: "session.selected", sessionID: "ses_1" })
    expect(state.selectedSessionID).toBe("ses_1")
  })

  test("tracks pending permission", () => {
    const state = reduceMobileState(initialMobileState, {
      type: "permission.requested",
      request: { sessionID: "ses_1", permissionID: "perm_1", title: "Run command" },
    })
    expect(state.permissions).toHaveLength(1)
  })

  test("removes permission response", () => {
    const requested = reduceMobileState(initialMobileState, {
      type: "permission.requested",
      request: { sessionID: "ses_1", permissionID: "perm_1", title: "Run command" },
    })
    const responded = reduceMobileState(requested, { type: "permission.responded", permissionID: "perm_1" })
    expect(responded.permissions).toEqual([])
  })
})
```

- [ ] **Step 2: Run failing tests**

Run from `packages/mobile`:

```bash
bun test src/state/mobile-state.test.ts
```

Expected: FAIL because `./mobile-state` does not exist.

- [ ] **Step 3: Implement reducer**

Create `packages/mobile/src/state/mobile-state.ts`:

```ts
import type { Connection, PermissionRequest, SessionMessage } from "../client/types"

export type MobileState = {
  connection?: Connection
  version?: string
  selectedSessionID?: string
  messages: Record<string, SessionMessage[]>
  permissions: PermissionRequest[]
  error?: string
}

export type MobileAction =
  | { type: "connected"; connection: Connection; version: string }
  | { type: "connection.failed"; error: string }
  | { type: "session.selected"; sessionID: string }
  | { type: "messages.loaded"; sessionID: string; messages: SessionMessage[] }
  | { type: "permission.requested"; request: PermissionRequest }
  | { type: "permission.responded"; permissionID: string }

export const initialMobileState: MobileState = {
  messages: {},
  permissions: [],
}

export function reduceMobileState(state: MobileState, action: MobileAction): MobileState {
  if (action.type === "connected") {
    return { ...state, connection: action.connection, version: action.version, error: undefined }
  }
  if (action.type === "connection.failed") return { ...state, error: action.error }
  if (action.type === "session.selected") return { ...state, selectedSessionID: action.sessionID }
  if (action.type === "messages.loaded") {
    return { ...state, messages: { ...state.messages, [action.sessionID]: action.messages } }
  }
  if (action.type === "permission.requested") return { ...state, permissions: [...state.permissions, action.request] }
  if (action.type === "permission.responded") {
    return { ...state, permissions: state.permissions.filter((item) => item.permissionID !== action.permissionID) }
  }
  return state
}
```

- [ ] **Step 4: Run reducer tests**

Run from `packages/mobile`:

```bash
bun test src/state/mobile-state.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/mobile/src/state
git commit -m "feat(mobile): add app state reducer"
```

---

### Task 6: Mobile UI shell and connection flow

**Files:**
- Create: `packages/mobile/src/ui/theme.ts`
- Create: `packages/mobile/src/ui/ConnectionScreen.tsx`
- Create: `packages/mobile/src/ui/HomeScreen.tsx`
- Modify: `packages/mobile/App.tsx`

- [ ] **Step 1: Create theme**

Create `packages/mobile/src/ui/theme.ts`:

```ts
export const colors = {
  background: "#0b0f14",
  panel: "#111827",
  border: "#263241",
  text: "#f8fafc",
  muted: "#94a3b8",
  accent: "#38bdf8",
  danger: "#fb7185",
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
}
```

- [ ] **Step 2: Create connection screen**

Create `packages/mobile/src/ui/ConnectionScreen.tsx`:

```tsx
import { useState } from "react"
import { Pressable, Text, TextInput, View } from "react-native"
import type { Connection } from "../client/types"
import { colors, spacing } from "./theme"

export function ConnectionScreen(props: { error?: string; onConnect(connection: Connection): void }) {
  const [url, setUrl] = useState("http://localhost:4096")
  const [username, setUsername] = useState("opencode")
  const [password, setPassword] = useState("")

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: spacing.xl, backgroundColor: colors.background }}>
      <Text style={{ color: colors.text, fontSize: 30, fontWeight: "800" }}>Connect to opencode</Text>
      <Text style={{ color: colors.muted, marginTop: spacing.sm }}>Use `opencode serve --hostname 0.0.0.0 --port 4096` on your PC or server.</Text>
      <TextInput value={url} onChangeText={setUrl} autoCapitalize="none" style={inputStyle} placeholder="Server URL" placeholderTextColor={colors.muted} />
      <TextInput value={username} onChangeText={setUsername} autoCapitalize="none" style={inputStyle} placeholder="Username" placeholderTextColor={colors.muted} />
      <TextInput value={password} onChangeText={setPassword} secureTextEntry style={inputStyle} placeholder="Password" placeholderTextColor={colors.muted} />
      {props.error ? <Text style={{ color: colors.danger, marginTop: spacing.md }}>{props.error}</Text> : null}
      <Pressable style={{ marginTop: spacing.lg, backgroundColor: colors.accent, padding: spacing.lg, borderRadius: 12 }} onPress={() => props.onConnect({ url, username, password })}>
        <Text style={{ color: "#001018", textAlign: "center", fontWeight: "800" }}>Connect</Text>
      </Pressable>
    </View>
  )
}

const inputStyle = {
  color: colors.text,
  borderColor: colors.border,
  borderWidth: 1,
  borderRadius: 12,
  padding: spacing.md,
  marginTop: spacing.md,
} as const
```

- [ ] **Step 3: Create home screen**

Create `packages/mobile/src/ui/HomeScreen.tsx`:

```tsx
import { Pressable, Text, View } from "react-native"
import type { Connection } from "../client/types"
import { colors, spacing } from "./theme"

export function HomeScreen(props: { connection: Connection; version?: string; onOpenSessions(): void; onOpenFiles(): void }) {
  return (
    <View style={{ flex: 1, padding: spacing.xl, backgroundColor: colors.background }}>
      <Text style={{ color: colors.text, fontSize: 28, fontWeight: "800" }}>opencode</Text>
      <Text style={{ color: colors.muted, marginTop: spacing.sm }}>{props.connection.url}</Text>
      <Text style={{ color: colors.muted, marginTop: spacing.xs }}>Server {props.version || "connected"}</Text>
      <Pressable style={buttonStyle} onPress={props.onOpenSessions}>
        <Text style={buttonTextStyle}>Sessions</Text>
      </Pressable>
      <Pressable style={buttonStyle} onPress={props.onOpenFiles}>
        <Text style={buttonTextStyle}>Files</Text>
      </Pressable>
    </View>
  )
}

const buttonStyle = {
  marginTop: spacing.lg,
  backgroundColor: colors.panel,
  borderColor: colors.border,
  borderWidth: 1,
  padding: spacing.lg,
  borderRadius: 12,
} as const

const buttonTextStyle = {
  color: colors.text,
  fontWeight: "700",
} as const
```

- [ ] **Step 4: Wire app shell**

Replace `packages/mobile/App.tsx` with:

```tsx
import { useReducer, useState } from "react"
import { SafeAreaView, StatusBar } from "react-native"
import { createOpencodeHttpClient } from "./src/client/http"
import type { Connection } from "./src/client/types"
import { createConnectionStore } from "./src/storage/connection-store"
import { initialMobileState, reduceMobileState } from "./src/state/mobile-state"
import { ConnectionScreen } from "./src/ui/ConnectionScreen"
import { HomeScreen } from "./src/ui/HomeScreen"
import { colors } from "./src/ui/theme"

export default function App() {
  const [state, dispatch] = useReducer(reduceMobileState, initialMobileState)
  const [screen, setScreen] = useState<"home" | "sessions" | "files">("home")

  async function connect(connection: Connection) {
    try {
      const health = await createOpencodeHttpClient(connection).health()
      await createConnectionStore().save(connection)
      dispatch({ type: "connected", connection, version: health.version })
    } catch (error) {
      dispatch({ type: "connection.failed", error: error instanceof Error ? error.message : String(error) })
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" />
      {state.connection ? (
        <HomeScreen connection={state.connection} version={state.version} onOpenSessions={() => setScreen("sessions")} onOpenFiles={() => setScreen("files")} />
      ) : (
        <ConnectionScreen error={state.error} onConnect={connect} />
      )}
    </SafeAreaView>
  )
}
```

- [ ] **Step 5: Run typecheck**

Run from `packages/mobile`:

```bash
bun typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/mobile/App.tsx packages/mobile/src/ui
git commit -m "feat(mobile): add connection flow"
```

---

### Task 7: Sessions, chat, files, diff, and permissions UI skeleton

**Files:**
- Create: `packages/mobile/src/ui/SessionScreen.tsx`
- Create: `packages/mobile/src/ui/FileScreen.tsx`
- Create: `packages/mobile/src/ui/DiffScreen.tsx`
- Create: `packages/mobile/src/ui/PermissionBanner.tsx`
- Modify: `packages/mobile/App.tsx`

- [ ] **Step 1: Create permission banner**

Create `packages/mobile/src/ui/PermissionBanner.tsx`:

```tsx
import { Pressable, Text, View } from "react-native"
import type { PermissionDecision, PermissionRequest } from "../client/types"
import { colors, spacing } from "./theme"

export function PermissionBanner(props: { request?: PermissionRequest; onRespond(response: PermissionDecision): void }) {
  if (!props.request) return null
  return (
    <View style={{ padding: spacing.md, backgroundColor: colors.panel, borderBottomColor: colors.border, borderBottomWidth: 1 }}>
      <Text style={{ color: colors.text, fontWeight: "800" }}>{props.request.title}</Text>
      <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm }}>
        <Pressable style={{ flex: 1, padding: spacing.md, borderRadius: 10, backgroundColor: colors.accent }} onPress={() => props.onRespond("allow")}>
          <Text style={{ textAlign: "center", fontWeight: "800" }}>Allow</Text>
        </Pressable>
        <Pressable style={{ flex: 1, padding: spacing.md, borderRadius: 10, backgroundColor: colors.danger }} onPress={() => props.onRespond("deny")}>
          <Text style={{ textAlign: "center", fontWeight: "800" }}>Deny</Text>
        </Pressable>
      </View>
    </View>
  )
}
```

- [ ] **Step 2: Create session screen**

Create `packages/mobile/src/ui/SessionScreen.tsx`:

```tsx
import { useEffect, useState } from "react"
import { FlatList, Pressable, Text, TextInput, View } from "react-native"
import type { OpencodeApi, SessionMessage } from "../client/types"
import { colors, spacing } from "./theme"

export function SessionScreen(props: { api: OpencodeApi; sessionID?: string; onOpenDiff(): void }) {
  const [messages, setMessages] = useState<SessionMessage[]>([])
  const [text, setText] = useState("")

  useEffect(() => {
    if (!props.sessionID) return
    props.api.listMessages(props.sessionID).then(setMessages).catch(() => setMessages([]))
  }, [props.api, props.sessionID])

  async function send() {
    if (!props.sessionID || !text.trim()) return
    await props.api.sendPrompt(props.sessionID, text.trim())
    setText("")
    setMessages(await props.api.listMessages(props.sessionID))
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", padding: spacing.md }}>
        <Text style={{ color: colors.text, fontWeight: "800" }}>{props.sessionID || "No session selected"}</Text>
        <Pressable onPress={props.onOpenDiff}>
          <Text style={{ color: colors.accent }}>Diff</Text>
        </Pressable>
      </View>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.info.id}
        renderItem={({ item }) => <Text style={{ color: colors.text, padding: spacing.md }}>{item.parts.map((part) => part.text).filter(Boolean).join("\n") || item.info.role}</Text>}
      />
      <View style={{ flexDirection: "row", padding: spacing.md, gap: spacing.sm }}>
        <TextInput value={text} onChangeText={setText} style={{ flex: 1, color: colors.text, borderColor: colors.border, borderWidth: 1, borderRadius: 10, padding: spacing.md }} />
        <Pressable onPress={send} style={{ backgroundColor: colors.accent, padding: spacing.md, borderRadius: 10 }}>
          <Text style={{ fontWeight: "800" }}>Send</Text>
        </Pressable>
      </View>
    </View>
  )
}
```

- [ ] **Step 3: Create file screen**

Create `packages/mobile/src/ui/FileScreen.tsx`:

```tsx
import { useEffect, useState } from "react"
import { FlatList, Pressable, Text, View } from "react-native"
import type { FileContent, FileNode } from "@opencode-ai/sdk/client"
import type { OpencodeApi } from "../client/types"
import { colors, spacing } from "./theme"

export function FileScreen(props: { api: OpencodeApi }) {
  const [nodes, setNodes] = useState<FileNode[]>([])
  const [content, setContent] = useState<FileContent | undefined>()

  useEffect(() => {
    props.api.listFiles(".").then(setNodes).catch(() => setNodes([]))
  }, [props.api])

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {content ? (
        <Text style={{ color: colors.text, padding: spacing.md, fontFamily: "monospace" }}>{String(content.content || "")}</Text>
      ) : (
        <FlatList
          data={nodes}
          keyExtractor={(item, index) => `${item.path}-${index}`}
          renderItem={({ item }) => (
            <Pressable onPress={() => props.api.readFile(item.path).then(setContent).catch(() => undefined)}>
              <Text style={{ color: colors.text, padding: spacing.md }}>{item.path}</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  )
}
```

- [ ] **Step 4: Create diff screen**

Create `packages/mobile/src/ui/DiffScreen.tsx`:

```tsx
import { useEffect, useState } from "react"
import { FlatList, Text, View } from "react-native"
import type { FileDiff } from "@opencode-ai/sdk/client"
import type { OpencodeApi } from "../client/types"
import { colors, spacing } from "./theme"

export function DiffScreen(props: { api: OpencodeApi; sessionID?: string }) {
  const [diffs, setDiffs] = useState<FileDiff[]>([])

  useEffect(() => {
    if (!props.sessionID) return
    props.api.getDiff(props.sessionID).then(setDiffs).catch(() => setDiffs([]))
  }, [props.api, props.sessionID])

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.background }}
      data={diffs}
      keyExtractor={(item) => item.file}
      renderItem={({ item }) => (
        <View style={{ padding: spacing.md, borderBottomColor: colors.border, borderBottomWidth: 1 }}>
          <Text style={{ color: colors.text, fontWeight: "800" }}>{item.file}</Text>
          <Text style={{ color: colors.muted }}>+{item.additions} -{item.deletions}</Text>
        </View>
      )}
    />
  )
}
```

- [ ] **Step 5: Wire screens in App**

Replace `packages/mobile/App.tsx` with:

```tsx
import { useMemo, useReducer, useState } from "react"
import { SafeAreaView, StatusBar } from "react-native"
import { createOpencodeHttpClient } from "./src/client/http"
import type { Connection } from "./src/client/types"
import { createConnectionStore } from "./src/storage/connection-store"
import { initialMobileState, reduceMobileState } from "./src/state/mobile-state"
import { ConnectionScreen } from "./src/ui/ConnectionScreen"
import { DiffScreen } from "./src/ui/DiffScreen"
import { FileScreen } from "./src/ui/FileScreen"
import { HomeScreen } from "./src/ui/HomeScreen"
import { PermissionBanner } from "./src/ui/PermissionBanner"
import { SessionScreen } from "./src/ui/SessionScreen"
import { colors } from "./src/ui/theme"

export default function App() {
  const [state, dispatch] = useReducer(reduceMobileState, initialMobileState)
  const [screen, setScreen] = useState<"home" | "sessions" | "files" | "diff">("home")
  const api = useMemo(() => (state.connection ? createOpencodeHttpClient(state.connection) : undefined), [state.connection])

  async function connect(connection: Connection) {
    try {
      const health = await createOpencodeHttpClient(connection).health()
      await createConnectionStore().save(connection)
      dispatch({ type: "connected", connection, version: health.version })
    } catch (error) {
      dispatch({ type: "connection.failed", error: error instanceof Error ? error.message : String(error) })
    }
  }

  async function respond(response: "allow" | "deny") {
    if (!api || !state.permissions[0]) return
    await api.respondPermission(state.permissions[0].sessionID, state.permissions[0].permissionID, response)
    dispatch({ type: "permission.responded", permissionID: state.permissions[0].permissionID })
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" />
      <PermissionBanner request={state.permissions[0]} onRespond={respond} />
      {!state.connection || !api ? <ConnectionScreen error={state.error} onConnect={connect} /> : null}
      {state.connection && api && screen === "home" ? <HomeScreen connection={state.connection} version={state.version} onOpenSessions={() => setScreen("sessions")} onOpenFiles={() => setScreen("files")} /> : null}
      {api && screen === "sessions" ? <SessionScreen api={api} sessionID={state.selectedSessionID} onOpenDiff={() => setScreen("diff")} /> : null}
      {api && screen === "files" ? <FileScreen api={api} /> : null}
      {api && screen === "diff" ? <DiffScreen api={api} sessionID={state.selectedSessionID} /> : null}
    </SafeAreaView>
  )
}
```

- [ ] **Step 6: Run typecheck**

Run from `packages/mobile`:

```bash
bun typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/mobile/App.tsx packages/mobile/src/ui
git commit -m "feat(mobile): add core workflow screens"
```

---

### Task 8: Verification and docs

**Files:**
- Modify: `docs/superpowers/specs/2026-05-25-mobile-client-design.md`
- Create or modify: `packages/mobile/README.md`

- [ ] **Step 1: Add mobile README**

Create `packages/mobile/README.md`:

```md
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
```

- [ ] **Step 2: Run mobile tests**

Run from `packages/mobile`:

```bash
bun test src
```

Expected: PASS.

- [ ] **Step 3: Run mobile typecheck**

Run from `packages/mobile`:

```bash
bun typecheck
```

Expected: PASS.

- [ ] **Step 4: Run root lint**

Run from repo root:

```bash
bun run lint
```

Expected: PASS.

- [ ] **Step 5: Run package typecheck through turbo**

Run from repo root:

```bash
bun run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/mobile/README.md docs/superpowers/specs/2026-05-25-mobile-client-design.md packages/mobile
git commit -m "docs(mobile): document development workflow"
```

---

## Self-Review

Spec coverage:

- React Native + Expo package: Task 1.
- Connection store and secure credentials: Task 4.
- HTTP client for opencode server: Task 2.
- SSE parsing and reconnect delay: Task 3.
- Sessions/chat/files/diff/permissions: Tasks 5 and 7.
- Security warning: Task 8 README plus Task 4 SecureStore.
- Testing: Tasks 2-5 and Task 8.

Placeholder scan: no TBD/TODO/implement later placeholders remain.

Type consistency: `Connection`, `OpencodeApi`, `PermissionRequest`, and reducer action names are defined before use and reused consistently.
