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
  const [, setScreen] = useState<"home" | "sessions" | "files">("home")

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
