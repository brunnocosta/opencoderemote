import { useMemo, useReducer, useRef, useState } from "react"
import { Pressable, SafeAreaView, StatusBar, Text, View } from "react-native"
import { createOpencodeHttpClient } from "./src/client/http"
import type { Connection, PermissionDecision } from "./src/client/types"
import { createConnectionStore } from "./src/storage/connection-store"
import { initialMobileState, reduceMobileState } from "./src/state/mobile-state"
import { ConnectionScreen } from "./src/ui/ConnectionScreen"
import { DiffScreen } from "./src/ui/DiffScreen"
import { FileScreen } from "./src/ui/FileScreen"
import { HomeScreen } from "./src/ui/HomeScreen"
import { PermissionBanner } from "./src/ui/PermissionBanner"
import { SessionScreen } from "./src/ui/SessionScreen"
import { colors, spacing } from "./src/ui/theme"

export default function App() {
  const [state, dispatch] = useReducer(reduceMobileState, initialMobileState)
  const [connecting, setConnecting] = useState(false)
  const [screen, setScreen] = useState<"home" | "sessions" | "files" | "diff">("home")
  const connectionRequest = useRef(0)
  const api = useMemo(() => (state.connection ? createOpencodeHttpClient(state.connection) : undefined), [state.connection])

  async function connect(connection: Connection) {
    const request = connectionRequest.current + 1
    connectionRequest.current = request
    setConnecting(true)

    try {
      const health = await createOpencodeHttpClient(connection).health()
      await createConnectionStore().save(connection)
      if (connectionRequest.current !== request) return
      dispatch({ type: "connected", connection, version: health.version })
    } catch (error) {
      if (connectionRequest.current !== request) return
      dispatch({ type: "connection.failed", error: error instanceof Error ? error.message : String(error) })
    } finally {
      if (connectionRequest.current === request) setConnecting(false)
    }
  }

  async function respond(response: PermissionDecision) {
    if (!api || !state.permissions[0]) return
    await api.respondPermission(state.permissions[0].sessionID, state.permissions[0].permissionID, response)
    dispatch({ type: "permission.responded", permissionID: state.permissions[0].permissionID })
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" />
      <PermissionBanner request={state.permissions[0]} onRespond={respond} />
      {!state.connection || !api ? <ConnectionScreen error={state.error} connecting={connecting} onConnect={connect} /> : null}
      {state.connection && api && screen === "home" ? (
        <View style={{ flex: 1 }}>
          <HomeScreen connection={state.connection} version={state.version} />
          <View style={{ flexDirection: "row", gap: spacing.sm, padding: spacing.md }}>
            <Pressable onPress={() => setScreen("sessions")} style={{ flex: 1, backgroundColor: colors.accent, padding: spacing.md, borderRadius: 10 }}>
              <Text style={{ textAlign: "center", fontWeight: "800" }}>Sessions</Text>
            </Pressable>
            <Pressable onPress={() => setScreen("files")} style={{ flex: 1, backgroundColor: colors.accent, padding: spacing.md, borderRadius: 10 }}>
              <Text style={{ textAlign: "center", fontWeight: "800" }}>Files</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
      {api && screen === "sessions" ? <SessionScreen api={api} sessionID={state.selectedSessionID} onSelectSession={(sessionID) => dispatch({ type: "session.selected", sessionID })} onOpenDiff={() => setScreen("diff")} /> : null}
      {api && screen === "files" ? <FileScreen api={api} /> : null}
      {api && screen === "diff" ? <DiffScreen api={api} sessionID={state.selectedSessionID} /> : null}
    </SafeAreaView>
  )
}
