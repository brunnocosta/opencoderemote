import { useEffect, useMemo, useReducer, useRef, useState, type Dispatch, type SetStateAction } from "react"
import { Pressable, SafeAreaView, StatusBar, Text, View } from "react-native"
import { streamEvents, type SseMessage } from "./src/client/events"
import { createOpencodeHttpClient } from "./src/client/http"
import type { Connection, PermissionDecision, PermissionRequest } from "./src/client/types"
import { createConnectionStore } from "./src/storage/connection-store"
import { initialMobileState, reduceMobileState, type MobileAction } from "./src/state/mobile-state"
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
  const [eventRevision, setEventRevision] = useState(0)
  const connectionRequest = useRef(0)
  const api = useMemo(() => (state.connection ? createOpencodeHttpClient(state.connection) : undefined), [state.connection])

  useEffect(() => {
    const request = connectionRequest.current + 1
    connectionRequest.current = request
    let active = true

    createConnectionStore().load().then(async (connection) => {
      if (!connection || connectionRequest.current !== request || !active) return
      try {
        const health = await createOpencodeHttpClient(connection).health()
        if (connectionRequest.current !== request || !active) return
        dispatch({ type: "connected", connection, version: health.version })
      } catch (error) {
        if (connectionRequest.current !== request || !active) return
        dispatch({ type: "connection.failed", error: error instanceof Error ? error.message : String(error) })
      }
    })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!state.connection || !api) return
    const abort = new AbortController()
    streamEvents(state.connection, (message) => handleEvent(message, dispatch, api, state.selectedSessionID, setEventRevision), abort.signal).catch(() => undefined)
    return () => abort.abort()
  }, [api, state.connection, state.selectedSessionID])

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
      {api && screen === "sessions" ? <SessionScreen api={api} sessionID={state.selectedSessionID} revision={eventRevision} onBack={() => setScreen("home")} onClearSession={() => dispatch({ type: "session.cleared" })} onSelectSession={(sessionID) => dispatch({ type: "session.selected", sessionID })} onOpenDiff={() => setScreen("diff")} /> : null}
      {api && screen === "files" ? <FileScreen api={api} onBack={() => setScreen("home")} /> : null}
      {api && screen === "diff" ? <DiffScreen api={api} sessionID={state.selectedSessionID} onBack={() => setScreen("sessions")} /> : null}
    </SafeAreaView>
  )
}

function handleEvent(message: SseMessage, dispatch: Dispatch<MobileAction>, api: ReturnType<typeof createOpencodeHttpClient>, selectedSessionID: string | undefined, refresh: Dispatch<SetStateAction<number>>) {
  const data = message.data
  if (!data || typeof data !== "object") return
  const event = data as Record<string, unknown>
  const type = typeof event.type === "string" ? event.type : message.event
  const properties = event.properties && typeof event.properties === "object" ? (event.properties as Record<string, unknown>) : event
  const permission = toPermissionRequest(properties)

  if (type === "permission.asked" && permission) dispatch({ type: "permission.requested", request: permission })
  if (type === "permission.replied" && typeof properties.requestID === "string") dispatch({ type: "permission.responded", permissionID: properties.requestID })
  if (type.startsWith("session.") || type.startsWith("message.")) {
    refresh((value) => value + 1)
    refreshSelectedSession(api, dispatch, selectedSessionID)
  }
}

function toPermissionRequest(value: Record<string, unknown>): PermissionRequest | undefined {
  const permissionID = stringValue(value.requestID) ?? stringValue(value.id) ?? stringValue(value.permissionID)
  const sessionID = stringValue(value.sessionID)
  if (!permissionID || !sessionID) return
  return {
    sessionID,
    permissionID,
    title: stringValue(value.title) ?? stringValue(value.permission) ?? "Permission requested",
    metadata: value.metadata,
  }
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : undefined
}

function refreshSelectedSession(api: ReturnType<typeof createOpencodeHttpClient>, dispatch: Dispatch<MobileAction>, selectedSessionID?: string) {
  if (!selectedSessionID) return
  api.listMessages(selectedSessionID)
    .then((messages) => dispatch({ type: "messages.loaded", sessionID: selectedSessionID, messages }))
    .catch(() => undefined)
}
