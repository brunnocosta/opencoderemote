function encodeBasicAuth(value: string) {
  const bytes = typeof TextEncoder === "undefined" ? Array.from(unescape(encodeURIComponent(value)), (char) => char.charCodeAt(0)) : Array.from(new TextEncoder().encode(value))
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
  return Array.from({ length: Math.ceil(bytes.length / 3) }, (_, index) => {
    const first = bytes[index * 3]
    const second = bytes[index * 3 + 1]
    const third = bytes[index * 3 + 2]
    const value = (first << 16) | ((second ?? 0) << 8) | (third ?? 0)
    return `${chars[(value >> 18) & 63]}${chars[(value >> 12) & 63]}${second === undefined ? "=" : chars[(value >> 6) & 63]}${third === undefined ? "=" : chars[value & 63]}`
  }).join("")
}

export function normalizeServerUrl(value: string) {
  return value.trim().replace(/\/+$/, "")
}

export function buildAuthHeaders(input: { username?: string; password?: string }) {
  if (!input.password) return {}
  return {
    Authorization: `Basic ${encodeBasicAuth(`${input.username || "opencode"}:${input.password}`)}`,
  }
}
