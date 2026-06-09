import { describe, expect, test } from "bun:test"
import { createBridgeInjection, getBundledWebSource, isReadyMessage } from "./webview-bridge"

describe("getBundledWebSource", () => {
  test("returns bundled Android asset source", () => {
    expect(getBundledWebSource()).toEqual({ uri: "file:///android_asset/opencode-web/index.html#/" })
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

describe("isReadyMessage", () => {
  test("detects opencode ready message", () => {
    expect(isReadyMessage("opencode.ready")).toBe(true)
    expect(isReadyMessage("other")).toBe(false)
  })
})
