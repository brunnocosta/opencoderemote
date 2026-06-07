export type Connection = {
  url: string
  username?: string
  password?: string
}

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

export function getConnectionValidation(connection: Pick<Connection, "url">) {
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

function isConnection(value: unknown): value is Connection {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false

  const connection = value as Record<string, unknown>
  return (
    typeof connection.url === "string" &&
    (connection.username === undefined || typeof connection.username === "string") &&
    (connection.password === undefined || typeof connection.password === "string")
  )
}
