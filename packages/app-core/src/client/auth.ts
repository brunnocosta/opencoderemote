export type Connection = {
  url: string
  username?: string
  password?: string
  trustedLocal?: boolean
}

export function normalizeServerUrl(value: string) {
  return value.trim().replace(/\/+$/, "")
}

export function buildAuthHeaders(input: { username?: string; password?: string }) {
  if (!input.password) return {}
  return { Authorization: `Basic ${encodeBasicAuth(input.username || "opencode", input.password)}` }
}

function encodeBasicAuth(username: string, password: string) {
  if (typeof btoa === "function") return btoa(`${username}:${password}`)
  return Buffer.from(`${username}:${password}`, "utf8").toString("base64")
}
