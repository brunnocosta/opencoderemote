import * as SecureStore from "expo-secure-store"
import { parseConnection, type Connection } from "./connection"

const key = "opencode.mobile.connection.v1"

export function createConnectionStore(storage = SecureStore) {
  return {
    async load() {
      const value = await storage.getItemAsync(key)
      if (!value) return
      return parseConnection(value)
    },
    save(connection: Connection) {
      return storage.setItemAsync(key, JSON.stringify(connection))
    },
    clear() {
      return storage.deleteItemAsync(key)
    },
  }
}
