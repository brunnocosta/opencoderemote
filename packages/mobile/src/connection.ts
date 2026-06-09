export type Connection = {
  url: string
  username?: string
  password?: string
}

export type ConnectionForm = {
  url: string
  username: string
  password: string
}

export const defaultUsername = "opencode"

export function normalizeServerUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ""
  const withProtocol = /^https?:\/\//.test(trimmed) ? trimmed : `http://${trimmed}`
  return withProtocol.replace(/\/+$/, "")
}

export function normalizeConnection(connection: Connection): Connection {
  return {
    url: normalizeServerUrl(connection.url),
    username: connection.username?.trim() || undefined,
    password: connection.password || undefined,
  }
}

export function normalizeConnectionForm(form: ConnectionForm) {
  return normalizeConnection(form)
}

export function connectionToForm(connection?: Connection): ConnectionForm {
  return {
    url: connection?.url ?? "",
    username: connection?.username ?? defaultUsername,
    password: connection?.password ?? "",
  }
}

export function getConnectionValidation(connection: ConnectionForm) {
  if (!normalizeServerUrl(connection.url)) return "Server URL is required"
  return undefined
}

export function parseConnection(value: string) {
  try {
    const connection = JSON.parse(value) as unknown
    if (!isConnection(connection)) return
    return connection
  } catch {
    return
  }
}

export function buildAuthHeader(connection: Connection) {
  if (!connection.username || !connection.password) return
  return `Basic ${base64EncodeUtf8(`${connection.username}:${connection.password}`)}`
}

function base64EncodeUtf8(value: string) {
  if (typeof Buffer !== "undefined") return Buffer.from(value, "utf8").toString("base64")
  const bytes = new TextEncoder().encode(value)
  return btoa(String.fromCharCode(...bytes))
}

function isConnection(value: unknown): value is Connection {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false

  const connection = value as Record<string, unknown>
  return (
    typeof connection.url === "string" &&
    (connection.username === undefined || typeof connection.username === "string") &&
    (connection.password === undefined || typeof connection.password === "string")
  )
}
