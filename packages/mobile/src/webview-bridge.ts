import type { Connection } from "./connection"

export const bundledWebAssetPrefix = "file:///android_asset/opencode-web/"

export function getBundledWebSource() {
  return { uri: `${bundledWebAssetPrefix}index.html#/` }
}

export function getWebViewRuntimeSettings() {
  return {
    androidLayerType: "hardware" as const,
    keyboardDisplayRequiresUserAction: false,
    overScrollMode: "never" as const,
  }
}

export function createBridgeInjection(connection?: Connection) {
  if (!connection) return "true;"
  const json = JSON.stringify(connection)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
  return `window.__OPENCODE__ = Object.assign({}, window.__OPENCODE__, { mobile: { server: ${json} } }); true;`
}

export function createDebugInjection() {
  return `(() => {
  const send = (level, values) => {
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: "opencode.webview.log", level, values: values.map((value) => {
        if (value instanceof Error) return value.stack || value.message
        if (typeof value === "string") return value
        try { return JSON.stringify(value) } catch { return String(value) }
      }) }))
    } catch {}
  }
  for (const level of ["debug", "info", "log", "warn", "error"]) {
    const original = console[level]
    console[level] = (...values) => {
      send(level, values)
      original?.apply(console, values)
    }
  }
  window.addEventListener("error", (event) => send("error", [event.message, event.filename, event.lineno, event.colno, event.error]))
  window.addEventListener("unhandledrejection", (event) => send("error", [event.reason]))
  const originalFetch = window.fetch
  window.fetch = async (...args) => {
    const started = Date.now()
    const url = String(args[0]?.url || args[0])
    send("debug", ["fetch:start", url])
    try {
      const response = await originalFetch(...args)
      send("debug", ["fetch:done", response.status, url, String(Date.now() - started) + "ms"])
      return response
    } catch (error) {
      send("error", ["fetch:error", url, error])
      throw error
    }
  }
  const OriginalWebSocket = window.WebSocket
  window.WebSocket = function(url, protocols) {
    send("debug", ["ws:create", String(url)])
    const socket = protocols === undefined ? new OriginalWebSocket(url) : new OriginalWebSocket(url, protocols)
    const originalSend = socket.send.bind(socket)
    socket.send = (data) => {
      send("debug", ["ws:send", typeof data, data?.byteLength || data?.length || 0, String(url)])
      return originalSend(data)
    }
    socket.addEventListener("open", () => send("debug", ["ws:open", String(url)]))
    socket.addEventListener("close", (event) => send("debug", ["ws:close", event.code, event.reason, String(url)]))
    socket.addEventListener("error", (event) => send("error", ["ws:error", String(url), event.type]))
    socket.addEventListener("message", (event) => send("debug", ["ws:message", typeof event.data, event.data?.byteLength || event.data?.length || 0, String(url)]))
    return socket
  }
  window.WebSocket.prototype = OriginalWebSocket.prototype
})()`
}

export function getWebViewInjection(connection?: Connection) {
  return `${createDebugInjection()}\n${createBridgeInjection(connection)}`
}

export function parseWebViewLogMessage(value: string) {
  try {
    const message = JSON.parse(value) as { type?: unknown; level?: unknown; values?: unknown }
    if (message.type !== "opencode.webview.log") return
    if (typeof message.level !== "string") return
    if (!Array.isArray(message.values)) return
    return { level: message.level, values: message.values.map(String) }
  } catch {
    return
  }
}

export function isReadyMessage(value: string) {
  return value === "opencode.ready"
}
