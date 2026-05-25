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
        return JSON.parse(value) as Connection
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
