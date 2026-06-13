import { describe, expect, test } from "bun:test"
import {
  createBridgeInjection,
  getBundledWebSource,
  getWebViewInjection,
  getWebViewRuntimeSettings,
  parseWebViewLogMessage,
  isReadyMessage,
} from "./webview-bridge"

describe("getBundledWebSource", () => {
  test("returns bundled Android asset source", () => {
    expect(getBundledWebSource()).toEqual({ uri: "file:///android_asset/opencode-web/index.html#/" })
  })
})

describe("getWebViewRuntimeSettings", () => {
  test("uses hardware rendering and Android input support", () => {
    expect(getWebViewRuntimeSettings()).toEqual({
      androidLayerType: "hardware",
      keyboardDisplayRequiresUserAction: false,
      overScrollMode: "never",
    })
  })
})

describe("getWebViewInjection", () => {
  test("forwards console and error events through the native bridge", () => {
    const result = getWebViewInjection()
    expect(result).toContain("window.ReactNativeWebView.postMessage")
    expect(result).toContain("opencode.webview.log")
    expect(result).toContain("unhandledrejection")
    expect(result).toContain("window.fetch")
    expect(result).toContain("window.WebSocket")
    expect(result).toContain("ws:send")
  })

  test("includes server bridge when connection exists", () => {
    expect(getWebViewInjection({ url: "http://localhost:4096", username: "opencode" })).toContain(
      'mobile: { server: {"url":"http://localhost:4096","username":"opencode"} }',
    )
  })
})

describe("createBridgeInjection", () => {
  test("returns no-op script without connection", () => {
    expect(createBridgeInjection()).toBe("true;")
  })

  test("serializes connection into window bridge", () => {
    expect(createBridgeInjection({ url: "http://localhost:4096", username: "opencode" })).toContain(
      'window.__OPENCODE__ = Object.assign({}, window.__OPENCODE__, { mobile: { server: {"url":"http://localhost:4096","username":"opencode"} } }); true;',
    )
  })

  test("escapes </script> to prevent script tag injection", () => {
    const result = createBridgeInjection({ url: "http://evil.com</script><script>alert(1)</script>", username: "test" })
    expect(result).not.toContain("</script>")
    expect(result).toContain("\\u003c/script\\u003e")
  })

  test("escapes <script> to prevent script tag injection", () => {
    const result = createBridgeInjection({ url: "http://test.com", username: "<script>alert(1)</script>" })
    expect(result).not.toContain("<script>")
    expect(result).toContain("\\u003cscript\\u003e")
  })

  test("escapes Unicode line separator U+2028", () => {
    const result = createBridgeInjection({ url: "http://test.com", username: "test\u2028break" })
    expect(result).not.toContain("\u2028")
    expect(result).toContain("\\u2028")
  })

  test("escapes Unicode paragraph separator U+2029", () => {
    const result = createBridgeInjection({ url: "http://test.com", username: "test\u2029break" })
    expect(result).not.toContain("\u2029")
    expect(result).toContain("\\u2029")
  })
})

describe("parseWebViewLogMessage", () => {
  test("parses WebView log messages", () => {
    expect(parseWebViewLogMessage(JSON.stringify({ type: "opencode.webview.log", level: "error", values: ["boom"] }))).toEqual({
      level: "error",
      values: ["boom"],
    })
  })

  test("ignores unrelated messages", () => {
    expect(parseWebViewLogMessage("opencode.ready")).toBeUndefined()
    expect(parseWebViewLogMessage(JSON.stringify({ type: "other" }))).toBeUndefined()
  })
})

describe("isReadyMessage", () => {
  test("detects opencode ready message", () => {
    expect(isReadyMessage("opencode.ready")).toBe(true)
    expect(isReadyMessage("other")).toBe(false)
  })
})
