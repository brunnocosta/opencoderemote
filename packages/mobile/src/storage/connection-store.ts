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

      try {
        const connection = JSON.parse(value) as unknown
        if (!isConnection(connection)) return
        return connection
      } catch {
        return
      }
    },
    save(connection: Connection) {
      return storage.setItemAsync(key, JSON.stringify(connection))
    },
    clear() {
      return storage.deleteItemAsync(key)
    },
  }
}

function isConnection(value: unknown): value is Connection {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false

  const connection = value as Record<string, unknown>
  return (
    typeof connection.url === "string" &&
    (connection.username === undefined || typeof connection.username === "string") &&
    (connection.password === undefined || typeof connection.password === "string") &&
    (connection.trustedLocal === undefined || typeof connection.trustedLocal === "boolean")
  )
}
