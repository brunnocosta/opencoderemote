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

const OpencodeWebView = WebView as unknown as (props: WebViewProps & { ref?: Ref<WebView> }) => ReactElement | null

export default function App() {
  return (
    <SafeAreaProvider>
      <MobileApp />
    </SafeAreaProvider>
  )
}

function MobileApp() {
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
        <>
          {/* Permissive settings required for bundled local assets (file:///android_asset/) and web-to-native bridge communication. Safe because content is bundled, not remote. */}
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
        </>
      ) : null}
    </View>
  )
}

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

function LoadingScreen() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 100)
    return () => clearTimeout(timer)
  }, [])
  if (!ready) return null
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
      <Text style={{ color: colors.muted }}>Loading opencode...</Text>
    </View>
  )
}

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

const inputStyle = {
  color: colors.text,
  borderColor: colors.border,
  borderWidth: 1,
  borderRadius: 10,
  padding: spacing.md,
  marginTop: spacing.md,
} as const
