import { describe, expect, test } from "bun:test"
import { getBackAction, getNavigationAction } from "./navigation"

describe("getNavigationAction", () => {
  test("allows bundled asset navigation", () => {
    expect(getNavigationAction("file:///android_asset/opencode-web/index.html#/session")).toEqual({ type: "allow" })
  })

  test("allows non-http schemes inside WebView", () => {
    expect(getNavigationAction("about:blank")).toEqual({ type: "allow" })
  })

  test("opens external http links outside WebView", () => {
    expect(getNavigationAction("https://example.com/docs")).toEqual({ type: "external", url: "https://example.com/docs" })
  })
})

describe("getBackAction", () => {
  test("goes back inside WebView when possible", () => {
    expect(getBackAction({ canGoBack: true, showingConnection: false })).toBe("webview-back")
  })

  test("returns to WebView from connection editor when a saved connection exists", () => {
    expect(getBackAction({ canGoBack: false, showingConnection: true, hasConnection: true })).toBe("show-webview")
  })

  test("lets Android handle back when no native action applies", () => {
    expect(getBackAction({ canGoBack: false, showingConnection: false })).toBe("system")
  })
})
