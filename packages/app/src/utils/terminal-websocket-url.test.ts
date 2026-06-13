import { describe, expect, test } from "bun:test"
import { shouldFallbackFromConnectTokenStatus, shouldUsePtyConnectToken, terminalWebSocketURL } from "./terminal-websocket-url"

describe("shouldUsePtyConnectToken", () => {
  test("skips connect tokens for file-backed WebView origins", () => {
    expect(shouldUsePtyConnectToken("file://")).toBe(false)
  })

  test("uses connect tokens for normal web origins", () => {
    expect(shouldUsePtyConnectToken("http://localhost:4444")).toBe(true)
    expect(shouldUsePtyConnectToken("https://app.opencode.ai")).toBe(true)
  })
})

describe("shouldFallbackFromConnectTokenStatus", () => {
  test("falls back when origin checks reject file-backed WebView token requests", () => {
    expect(shouldFallbackFromConnectTokenStatus(403)).toBe(true)
  })

  test("falls back for servers without token support", () => {
    expect(shouldFallbackFromConnectTokenStatus(404)).toBe(true)
    expect(shouldFallbackFromConnectTokenStatus(405)).toBe(true)
  })
})

describe("terminalWebSocketURL", () => {
  test("uses query auth without embedding credentials in websocket URL", () => {
    const url = terminalWebSocketURL({
      url: "http://127.0.0.1:49365",
      id: "pty_test",
      directory: "/tmp/project",
      cursor: 0,
      sameOrigin: false,
      username: "opencode",
      password: "secret",
    })

    expect(url.protocol).toBe("ws:")
    expect(url.username).toBe("")
    expect(url.password).toBe("")
    expect(url.searchParams.get("auth_token")).toBe(btoa("opencode:secret"))
  })

  test("omits query auth for same-origin saved credentials", () => {
    const url = terminalWebSocketURL({
      url: "https://app.example.test",
      id: "pty_test",
      directory: "/tmp/project",
      cursor: 10,
      sameOrigin: true,
      username: "opencode",
      password: "secret",
    })

    expect(url.protocol).toBe("wss:")
    expect(url.searchParams.has("auth_token")).toBe(false)
  })

  test("uses query auth for same-origin credentials from auth_token", () => {
    const url = terminalWebSocketURL({
      url: "https://app.example.test",
      id: "pty_test",
      directory: "/tmp/project",
      cursor: 10,
      sameOrigin: true,
      username: "opencode",
      password: "secret",
      authToken: true,
    })

    expect(url.protocol).toBe("wss:")
    expect(url.searchParams.get("auth_token")).toBe(btoa("opencode:secret"))
  })
})
