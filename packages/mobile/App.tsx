import { useReducer, useRef, useState } from "react"
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
  const [connecting, setConnecting] = useState(false)
  const connectionRequest = useRef(0)

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" />
      {state.connection ? (
        <HomeScreen connection={state.connection} version={state.version} />
      ) : (
        <ConnectionScreen error={state.error} connecting={connecting} onConnect={connect} />
      )}
    </SafeAreaView>
  )
}
