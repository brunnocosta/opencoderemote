import type { Connection } from "../client/types"

export function getConnectionValidation(connection: Pick<Connection, "url" | "password" | "trustedLocal">) {
  if (!connection.url.trim()) return "Server URL is required"
  if (!connection.password && !connection.trustedLocal) return "Password is required unless you trust a local server"
  return undefined
}
