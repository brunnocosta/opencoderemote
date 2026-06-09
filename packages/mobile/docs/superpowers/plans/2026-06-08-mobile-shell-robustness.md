# Mobile Shell Robustness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the Android mobile shell connection UX, reliability, and testability while changing only `packages/mobile`.

**Architecture:** Keep `App.tsx` as the React Native orchestrator and move mobile shell rules into focused modules under `packages/mobile/src`. Keep the WebView strategy unchanged: local bundled web assets receive `window.__OPENCODE__.mobile.server` through generated injection JavaScript.

**Tech Stack:** Expo, React Native, react-native-webview, expo-secure-store, Bun test, TypeScript.

---

## File Structure

- Modify: `packages/mobile/App.tsx`
  - Keep app-level state, lifecycle effects, SecureStore load/save/clear calls, and WebView rendering orchestration.
  - Delegate reusable policy and serialization to `src` modules.
- Modify: `packages/mobile/src/connection.ts`
  - Own `Connection`, form values, normalization, validation, parsing, and auth header construction.
- Create: `packages/mobile/src/health.ts`
  - Own optional server health checks with injected fetch.
- Create: `packages/mobile/src/health.test.ts`
  - Test health check success, failure, network failure, and auth behavior.
- Create: `packages/mobile/src/webview-bridge.ts`
  - Own bundled asset source, bridge injection generation, and ready-message parsing.
- Create: `packages/mobile/src/webview-bridge.test.ts`
  - Test injection behavior and ready-message handling.
- Create: `packages/mobile/src/navigation.ts`
  - Own bundled asset URL detection, external link policy, and back behavior policy.
- Create: `packages/mobile/src/navigation.test.ts`
  - Test navigation and back policy without React Native.
- Modify: `packages/mobile/src/connection.test.ts`
  - Extend coverage for optional password, auth headers, form values, and parsing.
- Modify: `packages/mobile/README.md`
  - Document optional password, health-check fallback, and changing/forgetting servers.

## Commands

Run all commands from `packages/mobile` unless the step says otherwise:

```bash
bun test src
bun typecheck
```

---

### Task 1: Deepen connection rules

**Files:**
- Modify: `packages/mobile/src/connection.ts`
- Modify: `packages/mobile/src/connection.test.ts`

- [ ] **Step 1: Replace `packages/mobile/src/connection.test.ts` with failing tests**

```ts
import { describe, expect, test } from "bun:test"
import {
  buildAuthHeader,
  connectionToForm,
  getConnectionValidation,
  normalizeConnection,
  normalizeConnectionForm,
  normalizeServerUrl,
  parseConnection,
  type ConnectionForm,
} from "./connection"

describe("normalizeServerUrl", () => {
  test("adds http protocol and removes trailing slashes", () => {
    expect(normalizeServerUrl(" 192.168.1.10:4096/// ")).toBe("http://192.168.1.10:4096")
  })

  test("keeps explicit https protocol", () => {
    expect(normalizeServerUrl(" https://example.com/ ")).toBe("https://example.com")
  })
})

describe("normalizeConnection", () => {
  test("trims username and preserves optional password", () => {
    expect(normalizeConnection({ url: "localhost:4096", username: " opencode ", password: "" })).toEqual({
      url: "http://localhost:4096",
      username: "opencode",
      password: undefined,
    })
  })

  test("does not require password", () => {
    expect(normalizeConnection({ url: "localhost:4096", username: "opencode" })).toEqual({
      url: "http://localhost:4096",
      username: "opencode",
      password: undefined,
    })
  })
})

describe("normalizeConnectionForm", () => {
  test("normalizes form values into a connection", () => {
    const form: ConnectionForm = { url: " 10.0.0.2:4096/ ", username: " opencode ", password: " secret " }
    expect(normalizeConnectionForm(form)).toEqual({
      url: "http://10.0.0.2:4096",
      username: "opencode",
      password: " secret ",
    })
  })
})

describe("connectionToForm", () => {
  test("prefills missing username and optional password", () => {
    expect(connectionToForm({ url: "http://localhost:4096" })).toEqual({
      url: "http://localhost:4096",
      username: "opencode",
      password: "",
    })
  })
})

describe("getConnectionValidation", () => {
  test("requires server URL", () => {
    expect(getConnectionValidation({ url: " ", username: "opencode", password: "" })).toBe("Server URL is required")
  })

  test("accepts URL without password", () => {
    expect(getConnectionValidation({ url: "localhost:4096", username: "opencode", password: "" })).toBeUndefined()
  })
})

describe("parseConnection", () => {
  test("loads valid connection json", () => {
    expect(parseConnection(JSON.stringify({ url: "http://localhost:4096", username: "opencode" }))).toEqual({
      url: "http://localhost:4096",
      username: "opencode",
    })
  })

  test("ignores invalid connection json", () => {
    expect(parseConnection("not-json")).toBeUndefined()
    expect(parseConnection(JSON.stringify({ url: 4096 }))).toBeUndefined()
  })
})

describe("buildAuthHeader", () => {
  test("returns undefined without password", () => {
    expect(buildAuthHeader({ url: "http://localhost:4096", username: "opencode" })).toBeUndefined()
  })

  test("builds basic auth when username and password exist", () => {
    expect(buildAuthHeader({ url: "http://localhost:4096", username: "opencode", password: "secret" })).toBe(`Basic ${btoa("opencode:secret")}`)
  })
})
```

- [ ] **Step 2: Run the connection tests and verify they fail**

Run:

```bash
bun test src/connection.test.ts
```

Expected: FAIL because `ConnectionForm`, `normalizeConnectionForm`, `connectionToForm`, and `buildAuthHeader` are not exported yet.

- [ ] **Step 3: Replace `packages/mobile/src/connection.ts`**

```ts
export type Connection = {
  url: string
  username?: string
  password?: string
}

export type ConnectionForm = {
  url: string
  username: string
  password: string
}

export const defaultUsername = "opencode"

export function normalizeServerUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ""
  const withProtocol = /^https?:\/\//.test(trimmed) ? trimmed : `http://${trimmed}`
  return withProtocol.replace(/\/+$/, "")
}

export function normalizeConnection(connection: Connection): Connection {
  return {
    url: normalizeServerUrl(connection.url),
    username: connection.username?.trim() || undefined,
    password: connection.password || undefined,
  }
}

export function normalizeConnectionForm(form: ConnectionForm) {
  return normalizeConnection(form)
}

export function connectionToForm(connection?: Connection): ConnectionForm {
  return {
    url: connection?.url ?? "",
    username: connection?.username ?? defaultUsername,
    password: connection?.password ?? "",
  }
}

export function getConnectionValidation(connection: Pick<ConnectionForm, "url">) {
  if (!normalizeServerUrl(connection.url)) return "Server URL is required"
  return undefined
}

export function parseConnection(value: string) {
  try {
    const connection = JSON.parse(value) as unknown
    if (!isConnection(connection)) return
    return connection
  } catch {
    return
  }
}

export function buildAuthHeader(connection: Connection) {
  if (!connection.username || !connection.password) return
  return `Basic ${btoa(`${connection.username}:${connection.password}`)}`
}

function isConnection(value: unknown): value is Connection {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false

  const connection = value as Record<string, unknown>
  return (
    typeof connection.url === "string" &&
    (connection.username === undefined || typeof connection.username === "string") &&
    (connection.password === undefined || typeof connection.password === "string")
  )
}
```

- [ ] **Step 4: Run the connection tests and verify they pass**

Run:

```bash
bun test src/connection.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 1**

```bash
git add src/connection.ts src/connection.test.ts
git commit -m "refactor(mobile): deepen connection rules"
```

---

### Task 2: Add optional health check module

**Files:**
- Create: `packages/mobile/src/health.ts`
- Create: `packages/mobile/src/health.test.ts`

- [ ] **Step 1: Create `packages/mobile/src/health.test.ts` with failing tests**

```ts
import { describe, expect, test } from "bun:test"
import { checkServerHealth } from "./health"

describe("checkServerHealth", () => {
  test("returns ok for successful response", async () => {
    const result = await checkServerHealth(
      { url: "http://localhost:4096" },
      async () => new Response(JSON.stringify({ ok: true }), { status: 200 }),
    )

    expect(result).toEqual({ ok: true })
  })

  test("returns error for non-ok response", async () => {
    const result = await checkServerHealth(
      { url: "http://localhost:4096" },
      async () => new Response("nope", { status: 503, statusText: "Service Unavailable" }),
    )

    expect(result).toEqual({ ok: false, message: "Server health check failed: 503 Service Unavailable" })
  })

  test("returns error for network failure", async () => {
    const result = await checkServerHealth({ url: "http://localhost:4096" }, async () => {
      throw new Error("Network request failed")
    })

    expect(result).toEqual({ ok: false, message: "Network request failed" })
  })

  test("sends auth header only when password exists", async () => {
    const requests: Array<RequestInit | undefined> = []

    await checkServerHealth({ url: "http://localhost:4096", username: "opencode" }, async (_url, init) => {
      requests.push(init)
      return new Response("{}", { status: 200 })
    })

    await checkServerHealth({ url: "http://localhost:4096", username: "opencode", password: "secret" }, async (_url, init) => {
      requests.push(init)
      return new Response("{}", { status: 200 })
    })

    expect(requests[0]?.headers).toEqual(undefined)
    expect(requests[1]?.headers).toEqual({ authorization: `Basic ${btoa("opencode:secret")}` })
  })
})
```

- [ ] **Step 2: Run health tests and verify they fail**

Run:

```bash
bun test src/health.test.ts
```

Expected: FAIL because `src/health.ts` does not exist.

- [ ] **Step 3: Create `packages/mobile/src/health.ts`**

```ts
import { buildAuthHeader, type Connection } from "./connection"

export type HealthResult =
  | { ok: true }
  | { ok: false; message: string }

export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>

export async function checkServerHealth(connection: Connection, fetcher: FetchLike = fetch) {
  try {
    const auth = buildAuthHeader(connection)
    const response = await fetcher(`${connection.url}/health`, auth ? { headers: { authorization: auth } } : undefined)
    if (response.ok) return { ok: true } as const
    return { ok: false, message: `Server health check failed: ${response.status} ${response.statusText}` } as const
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) } as const
  }
}
```

- [ ] **Step 4: Run health tests and verify they pass**

Run:

```bash
bun test src/health.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 2**

```bash
git add src/health.ts src/health.test.ts
git commit -m "feat(mobile): add optional server health check"
```

---

### Task 3: Add WebView bridge module

**Files:**
- Create: `packages/mobile/src/webview-bridge.ts`
- Create: `packages/mobile/src/webview-bridge.test.ts`

- [ ] **Step 1: Create `packages/mobile/src/webview-bridge.test.ts` with failing tests**

```ts
import { describe, expect, test } from "bun:test"
import { createBridgeInjection, getBundledWebSource, isReadyMessage } from "./webview-bridge"

describe("getBundledWebSource", () => {
  test("returns bundled Android asset source", () => {
    expect(getBundledWebSource()).toEqual({ uri: "file:///android_asset/opencode-web/index.html#/" })
  })
})

describe("createBridgeInjection", () => {
  test("returns no-op script without connection", () => {
    expect(createBridgeInjection()).toBe("true;")
  })

  test("serializes connection into window bridge", () => {
    expect(createBridgeInjection({ url: "http://localhost:4096", username: "opencode" })).toContain(
      'window.__OPENCODE__ = Object.assign({}, window.__OPENCODE__, { mobile: { server: {"url":"http://localhost:4096","username":"opencode"} } }); true;',
    )
  })
})

describe("isReadyMessage", () => {
  test("detects opencode ready message", () => {
    expect(isReadyMessage("opencode.ready")).toBe(true)
    expect(isReadyMessage("other")).toBe(false)
  })
})
```

- [ ] **Step 2: Run bridge tests and verify they fail**

Run:

```bash
bun test src/webview-bridge.test.ts
```

Expected: FAIL because `src/webview-bridge.ts` does not exist.

- [ ] **Step 3: Create `packages/mobile/src/webview-bridge.ts`**

```ts
import type { Connection } from "./connection"

export const bundledWebAssetPrefix = "file:///android_asset/opencode-web/"

export function getBundledWebSource() {
  return { uri: `${bundledWebAssetPrefix}index.html#/` }
}

export function createBridgeInjection(connection?: Connection) {
  if (!connection) return "true;"
  return `window.__OPENCODE__ = Object.assign({}, window.__OPENCODE__, { mobile: { server: ${JSON.stringify(connection)} } }); true;`
}

export function isReadyMessage(value: string) {
  return value === "opencode.ready"
}
```

- [ ] **Step 4: Run bridge tests and verify they pass**

Run:

```bash
bun test src/webview-bridge.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 3**

```bash
git add src/webview-bridge.ts src/webview-bridge.test.ts
git commit -m "feat(mobile): add webview bridge helpers"
```

---

### Task 4: Add navigation policy module

**Files:**
- Create: `packages/mobile/src/navigation.ts`
- Create: `packages/mobile/src/navigation.test.ts`

- [ ] **Step 1: Create `packages/mobile/src/navigation.test.ts` with failing tests**

```ts
import { describe, expect, test } from "bun:test"
import { getBackAction, getNavigationAction } from "./navigation"

describe("getNavigationAction", () => {
  test("allows bundled asset navigation", () => {
    expect(getNavigationAction("file:///android_asset/opencode-web/index.html#/session")).toEqual({ type: "allow" })
  })

  test("allows non-http schemes inside WebView", () => {
    expect(getNavigationAction("about:blank")).toEqual({ type: "allow" })
  })

  test("opens external http links outside WebView", () => {
    expect(getNavigationAction("https://example.com/docs")).toEqual({ type: "external", url: "https://example.com/docs" })
  })
})

describe("getBackAction", () => {
  test("goes back inside WebView when possible", () => {
    expect(getBackAction({ canGoBack: true, showingConnection: false })).toBe("webview-back")
  })

  test("returns to WebView from connection editor when a saved connection exists", () => {
    expect(getBackAction({ canGoBack: false, showingConnection: true, hasConnection: true })).toBe("show-webview")
  })

  test("lets Android handle back when no native action applies", () => {
    expect(getBackAction({ canGoBack: false, showingConnection: false })).toBe("system")
  })
})
```

- [ ] **Step 2: Run navigation tests and verify they fail**

Run:

```bash
bun test src/navigation.test.ts
```

Expected: FAIL because `src/navigation.ts` does not exist.

- [ ] **Step 3: Create `packages/mobile/src/navigation.ts`**

```ts
import { bundledWebAssetPrefix } from "./webview-bridge"

export type NavigationAction =
  | { type: "allow" }
  | { type: "external"; url: string }

export type BackAction = "system" | "webview-back" | "show-webview"

export function getNavigationAction(url: string): NavigationAction {
  if (url.startsWith(bundledWebAssetPrefix)) return { type: "allow" }
  if (!url.startsWith("http://") && !url.startsWith("https://")) return { type: "allow" }
  return { type: "external", url }
}

export function getBackAction(state: { canGoBack: boolean; showingConnection: boolean; hasConnection?: boolean }): BackAction {
  if (state.showingConnection && state.hasConnection) return "show-webview"
  if (state.canGoBack && !state.showingConnection) return "webview-back"
  return "system"
}
```

- [ ] **Step 4: Run navigation tests and verify they pass**

Run:

```bash
bun test src/navigation.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 4**

```bash
git add src/navigation.ts src/navigation.test.ts
git commit -m "feat(mobile): add webview navigation policy"
```

---

### Task 5: Refactor App orchestration and redesign connection UX

**Files:**
- Modify: `packages/mobile/App.tsx`

- [ ] **Step 1: Update imports in `packages/mobile/App.tsx`**

Replace the import block at the top with:

```tsx
import { useEffect, useMemo, useRef, useState, type ReactElement, type Ref } from "react"
import { BackHandler, Linking, Pressable, StatusBar, Text, TextInput, View } from "react-native"
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context"
import { WebView, type WebViewMessageEvent, type WebViewNavigation, type WebViewProps } from "react-native-webview"
import { createConnectionStore } from "./src/connection-store"
import { connectionToForm, getConnectionValidation, normalizeConnectionForm, type Connection, type ConnectionForm } from "./src/connection"
import { checkServerHealth } from "./src/health"
import { getBackAction, getNavigationAction } from "./src/navigation"
import { colors, spacing } from "./src/theme"
import { createBridgeInjection, getBundledWebSource, isReadyMessage } from "./src/webview-bridge"
```

- [ ] **Step 2: Replace `MobileApp` state and memo setup**

Inside `MobileApp`, replace state declarations and memo declarations with:

```tsx
  const webview = useRef<WebView>(null)
  const insets = useSafeAreaInsets()
  const [connection, setConnection] = useState<Connection | undefined>()
  const [form, setForm] = useState<ConnectionForm>(() => connectionToForm())
  const [loaded, setLoaded] = useState(false)
  const [showingConnection, setShowingConnection] = useState(false)
  const [canGoBack, setCanGoBack] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [checking, setChecking] = useState(false)
  const source = useMemo(() => getBundledWebSource(), [])
  const injected = useMemo(() => createBridgeInjection(connection), [connection])
```

- [ ] **Step 3: Replace the SecureStore load effect**

Replace the first `useEffect` body with:

```tsx
  useEffect(() => {
    let active = true
    createConnectionStore()
      .load()
      .then((saved) => {
        if (!active) return
        setConnection(saved)
        setForm(connectionToForm(saved))
        setShowingConnection(!saved)
      })
      .catch((error) => {
        if (!active) return
        setError(error instanceof Error ? error.message : String(error))
        setShowingConnection(true)
      })
      .finally(() => {
        if (active) setLoaded(true)
      })

    return () => {
      active = false
    }
  }, [])
```

- [ ] **Step 4: Replace the back-handler effect**

Replace the second `useEffect` body with:

```tsx
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      const action = getBackAction({ canGoBack, showingConnection, hasConnection: Boolean(connection) })
      if (action === "webview-back") {
        webview.current?.goBack()
        return true
      }
      if (action === "show-webview") {
        setShowingConnection(false)
        return true
      }
      return false
    })
    return () => sub.remove()
  }, [canGoBack, connection, showingConnection])
```

- [ ] **Step 5: Replace the return block in `MobileApp`**

Replace the `return (` block in `MobileApp` with:

```tsx
  return (
    <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} translucent={false} />
      {!loaded ? <LoadingScreen /> : null}
      {loaded && showingConnection ? (
        <ConnectionScreen
          checking={checking}
          connection={connection}
          error={error}
          form={form}
          onCancel={connection ? () => setShowingConnection(false) : undefined}
          onChange={setForm}
          onConnect={() => saveConnection(form, setChecking, setConnection, setForm, setShowingConnection, setError)}
          onForget={() => forgetConnection(setConnection, setForm, setShowingConnection, setError)}
        />
      ) : null}
      {loaded && connection && !showingConnection ? (
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ color: colors.muted, flex: 1 }} numberOfLines={1}>{connection.url}</Text>
            <Pressable onPress={() => setShowingConnection(true)} style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
              <Text style={{ color: colors.accent, fontWeight: "800" }}>Change</Text>
            </Pressable>
          </View>
          <OpencodeWebView
            ref={webview}
            source={source}
            injectedJavaScriptBeforeContentLoaded={injected}
            originWhitelist={["*"]}
            allowFileAccess
            allowFileAccessFromFileURLs
            allowUniversalAccessFromFileURLs
            mixedContentMode="always"
            javaScriptEnabled
            domStorageEnabled
            setSupportMultipleWindows={false}
            onNavigationStateChange={(event) => setCanGoBack(event.canGoBack)}
            onShouldStartLoadWithRequest={openExternalLinks}
            onMessage={handleMessage}
            onError={() => {
              setError("Could not load the bundled opencode interface. Rebuild the mobile web assets.")
              setShowingConnection(true)
            }}
            style={{ flex: 1, backgroundColor: colors.background }}
          />
        </View>
      ) : null}
    </View>
  )
```

- [ ] **Step 6: Replace `ConnectionScreen`**

Replace the full `ConnectionScreen` function with:

```tsx
function ConnectionScreen(props: {
  checking: boolean
  connection?: Connection
  error?: string
  form: ConnectionForm
  onCancel?: () => void
  onChange(form: ConnectionForm): void
  onConnect(): void
  onForget(): void
}) {
  const validation = getConnectionValidation(props.form)

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: spacing.xl, backgroundColor: colors.background }}>
      <Text style={{ color: colors.text, fontSize: 34, fontWeight: "900" }}>opencode Android</Text>
      <Text style={{ color: colors.muted, marginTop: spacing.sm, lineHeight: 20 }}>
        Connect to an opencode server on your LAN. Password is optional.
      </Text>
      <TextInput
        value={props.form.url}
        onChangeText={(url) => props.onChange({ ...props.form, url })}
        autoCapitalize="none"
        style={inputStyle}
        placeholder="http://192.168.1.23:4096"
        placeholderTextColor={colors.muted}
      />
      <TextInput
        value={props.form.username}
        onChangeText={(username) => props.onChange({ ...props.form, username })}
        autoCapitalize="none"
        style={inputStyle}
        placeholder="Username"
        placeholderTextColor={colors.muted}
      />
      <TextInput
        value={props.form.password}
        onChangeText={(password) => props.onChange({ ...props.form, password })}
        secureTextEntry
        style={inputStyle}
        placeholder="Password (optional)"
        placeholderTextColor={colors.muted}
      />
      {validation ? <Text style={{ color: colors.danger, marginTop: spacing.md }}>{validation}</Text> : null}
      {props.error ? <Text style={{ color: colors.danger, marginTop: spacing.md }}>{props.error}</Text> : null}
      <Pressable
        disabled={Boolean(validation) || props.checking}
        style={{ marginTop: spacing.lg, backgroundColor: validation || props.checking ? colors.border : colors.accent, padding: spacing.lg, borderRadius: 10 }}
        onPress={props.onConnect}
      >
        <Text style={{ color: "#001018", textAlign: "center", fontWeight: "900" }}>{props.checking ? "Checking..." : "Open opencode"}</Text>
      </Pressable>
      <View style={{ flexDirection: "row", justifyContent: "center", gap: spacing.md, marginTop: spacing.md }}>
        {props.onCancel ? (
          <Pressable onPress={props.onCancel} style={{ padding: spacing.sm }}>
            <Text style={{ color: colors.muted, fontWeight: "700" }}>Cancel</Text>
          </Pressable>
        ) : null}
        {props.connection ? (
          <Pressable onPress={props.onForget} style={{ padding: spacing.sm }}>
            <Text style={{ color: colors.danger, fontWeight: "700" }}>Forget server</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  )
}
```

- [ ] **Step 7: Replace `saveConnection`, `openExternalLinks`, and `handleMessage`; add `forgetConnection`**

Replace those functions with:

```tsx
async function saveConnection(
  form: ConnectionForm,
  setChecking: (checking: boolean) => void,
  setConnection: (connection: Connection) => void,
  setForm: (form: ConnectionForm) => void,
  setShowingConnection: (showing: boolean) => void,
  setError: (error: string | undefined) => void,
) {
  const connection = normalizeConnectionForm(form)
  setChecking(true)
  const health = await checkServerHealth(connection)
  setChecking(false)
  if (!health.ok) setError(`${health.message}. Continuing anyway.`)
  else setError(undefined)
  await createConnectionStore().save(connection)
  setConnection(connection)
  setForm(connectionToForm(connection))
  setShowingConnection(false)
}

async function forgetConnection(
  setConnection: (connection: Connection | undefined) => void,
  setForm: (form: ConnectionForm) => void,
  setShowingConnection: (showing: boolean) => void,
  setError: (error: string | undefined) => void,
) {
  await createConnectionStore().clear()
  setConnection(undefined)
  setForm(connectionToForm())
  setError(undefined)
  setShowingConnection(true)
}

function openExternalLinks(request: WebViewNavigation) {
  const action = getNavigationAction(request.url)
  if (action.type === "allow") return true
  void Linking.openURL(action.url)
  return false
}

function handleMessage(event: WebViewMessageEvent) {
  if (isReadyMessage(event.nativeEvent.data)) return
}
```

- [ ] **Step 8: Run typecheck and app-related tests**

Run:

```bash
bun typecheck
bun test src
```

Expected: PASS. If typecheck fails because React Native style typing rejects `gap`, replace `gap: spacing.md` with `columnGap: spacing.md` in the `View` style and rerun both commands.

- [ ] **Step 9: Commit Task 5**

```bash
git add App.tsx
git commit -m "refactor(mobile): split shell orchestration"
```

---

### Task 6: Document mobile connection behavior

**Files:**
- Modify: `packages/mobile/README.md`

- [ ] **Step 1: Replace `packages/mobile/README.md`**

```md
# opencode Android

Expo Android shell for the responsive opencode web app.

The APK bundles the built `packages/app` UI under Android assets and loads it in a WebView. The native shell handles server connection, optional credentials, secure persistence, Android back behavior, external links, and WebView integration. The actual opencode interface stays in `packages/app`.

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

Password is optional in the Android shell. If your server was started with `OPENCODE_SERVER_PASSWORD`, enter it before opening opencode. The app attempts a health check before opening the bundled WebView; if the check fails, it shows the error but still lets you continue.

Use the native Change action above the WebView to edit the saved server. Editing does not clear the saved connection automatically. Use Forget server from the connection screen to delete it.

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
```

- [ ] **Step 2: Run mobile tests and typecheck**

Run:

```bash
bun test src
bun typecheck
```

Expected: PASS.

- [ ] **Step 3: Commit Task 6**

```bash
git add README.md
git commit -m "docs(mobile): document connection flow"
```

---

### Task 7: Final verification

**Files:**
- No file changes expected unless verification finds an issue.

- [ ] **Step 1: Run all mobile tests**

Run:

```bash
bun test src
```

Expected: PASS for all tests under `packages/mobile/src`.

- [ ] **Step 2: Run mobile typecheck**

Run:

```bash
bun typecheck
```

Expected: PASS.

- [ ] **Step 3: Inspect git status**

Run from repo root:

```bash
git status --short
```

Expected: no unstaged implementation changes. If generated files or local Android artifacts appear, do not commit them unless they are intentional tracked source changes under `packages/mobile`.

- [ ] **Step 4: Summarize implementation evidence**

Report:

```text
Implemented mobile shell robustness plan.
Verification:
- packages/mobile: bun test src passed
- packages/mobile: bun typecheck passed
```

---

## Self-Review

- Spec coverage: The plan covers mobile-only scope, optional password, health-check fallback, editable saved server, explicit forget action, App split, bridge/navigation tests, README updates, and mobile test/typecheck verification.
- Placeholder scan: No TBD/TODO placeholders remain.
- Type consistency: `Connection`, `ConnectionForm`, `HealthResult`, `NavigationAction`, and helper names are defined before use and reused consistently.
