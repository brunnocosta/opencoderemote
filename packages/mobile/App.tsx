import { useEffect, useMemo, useRef, useState, type ReactElement, type Ref } from "react"
import { BackHandler, Linking, Pressable, StatusBar, Text, TextInput, View } from "react-native"
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context"
import { WebView, type WebViewMessageEvent, type WebViewNavigation, type WebViewProps } from "react-native-webview"
import { createConnectionStore } from "./src/connection-store"
import { getConnectionValidation, normalizeConnection, type Connection } from "./src/connection"
import { colors, spacing } from "./src/theme"

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
  const [loaded, setLoaded] = useState(false)
  const [canGoBack, setCanGoBack] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const source = useMemo(() => ({ uri: "file:///android_asset/opencode-web/index.html#/" }), [])
  const injected = useMemo(() => {
    if (!connection) return "true;"
    return `window.__OPENCODE__ = Object.assign({}, window.__OPENCODE__, { mobile: { server: ${JSON.stringify(connection)} } }); true;`
  }, [connection])

  useEffect(() => {
    let active = true
    createConnectionStore()
      .load()
      .then((saved) => {
        if (active) setConnection(saved)
      })
      .catch((error) => {
        if (active) setError(error instanceof Error ? error.message : String(error))
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
      if (!canGoBack) return false
      webview.current?.goBack()
      return true
    })
    return () => sub.remove()
  }, [canGoBack])

  return (
    <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} translucent={false} />
      {!loaded ? <LoadingScreen /> : null}
      {loaded && !connection ? <ConnectionScreen error={error} onConnect={(next) => saveConnection(next, setConnection, setError)} /> : null}
      {loaded && connection ? (
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
            setConnection(undefined)
          }}
          style={{ flex: 1, backgroundColor: colors.background }}
        />
      ) : null}
    </View>
  )
}

function ConnectionScreen(props: { error?: string; onConnect(connection: Connection): void }) {
  const [url, setUrl] = useState("")
  const [username, setUsername] = useState("opencode")
  const [password, setPassword] = useState("")
  const validation = getConnectionValidation({ url })

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: spacing.xl, backgroundColor: colors.background }}>
      <Text style={{ color: colors.text, fontSize: 30, fontWeight: "800" }}>opencode Android</Text>
      <Text style={{ color: colors.muted, marginTop: spacing.sm }}>
        Enter the LAN URL from `opencode serve --hostname 0.0.0.0 --port 4096`.
      </Text>
      <TextInput value={url} onChangeText={setUrl} autoCapitalize="none" style={inputStyle} placeholder="http://192.168.1.23:4096" placeholderTextColor={colors.muted} />
      <TextInput value={username} onChangeText={setUsername} autoCapitalize="none" style={inputStyle} placeholder="Username" placeholderTextColor={colors.muted} />
      <TextInput value={password} onChangeText={setPassword} secureTextEntry style={inputStyle} placeholder="Password (optional)" placeholderTextColor={colors.muted} />
      {validation ? <Text style={{ color: colors.danger, marginTop: spacing.md }}>{validation}</Text> : null}
      {props.error ? <Text style={{ color: colors.danger, marginTop: spacing.md }}>{props.error}</Text> : null}
      <Pressable
        disabled={Boolean(validation)}
        style={{ marginTop: spacing.lg, backgroundColor: validation ? colors.border : colors.accent, padding: spacing.lg, borderRadius: 10 }}
        onPress={() => props.onConnect(normalizeConnection({ url, username, password }))}
      >
        <Text style={{ color: "#001018", textAlign: "center", fontWeight: "800" }}>Open opencode</Text>
      </Pressable>
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

async function saveConnection(connection: Connection, setConnection: (connection: Connection) => void, setError: (error: string | undefined) => void) {
  try {
    await createConnectionStore().save(connection)
    setError(undefined)
    setConnection(connection)
  } catch (error) {
    setError(error instanceof Error ? error.message : String(error))
  }
}

function openExternalLinks(request: WebViewNavigation) {
  if (request.url.startsWith("file:///android_asset/opencode-web/")) return true
  if (!request.url.startsWith("http://") && !request.url.startsWith("https://")) return true
  void Linking.openURL(request.url)
  return false
}

function handleMessage(event: WebViewMessageEvent) {
  if (event.nativeEvent.data === "opencode.ready") return
}

const inputStyle = {
  color: colors.text,
  borderColor: colors.border,
  borderWidth: 1,
  borderRadius: 10,
  padding: spacing.md,
  marginTop: spacing.md,
} as const
