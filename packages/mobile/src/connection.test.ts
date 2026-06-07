import { describe, expect, test } from "bun:test"
import { getConnectionValidation, normalizeConnection, normalizeServerUrl, parseConnection } from "./connection"

describe("normalizeServerUrl", () => {
  test("adds http protocol and removes trailing slashes", () => {
    expect(normalizeServerUrl(" 192.168.1.10:4096/// ")).toBe("http://192.168.1.10:4096")
  })

  test("keeps explicit https protocol", () => {
    expect(normalizeServerUrl(" https://example.com/ ")).toBe("https://example.com")
  })
})

describe("normalizeConnection", () => {
  test("trims empty username and preserves password", () => {
    expect(normalizeConnection({ url: "localhost:4096", username: " ", password: "secret" })).toEqual({
      url: "http://localhost:4096",
      username: undefined,
      password: "secret",
    })
  })
})

describe("getConnectionValidation", () => {
  test("requires server URL", () => {
    expect(getConnectionValidation({ url: " " })).toBe("Server URL is required")
  })
})

describe("parseConnection", () => {
  test("loads valid connection json", () => {
    expect(parseConnection(JSON.stringify({ url: "http://localhost:4096", username: "opencode" }))).toEqual({
      url: "http://localhost:4096",
      username: "opencode",
    })
  })

  test("ignores invalid connection json", () => {
    expect(parseConnection("not-json")).toBeUndefined()
    expect(parseConnection(JSON.stringify({ url: 4096 }))).toBeUndefined()
  })
})
