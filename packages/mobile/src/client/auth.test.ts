import { describe, expect, test } from "bun:test"
import { buildAuthHeaders, normalizeServerUrl } from "./auth"

describe("normalizeServerUrl", () => {
  test("removes trailing slash", () => {
    expect(normalizeServerUrl("http://localhost:4096/")).toBe("http://localhost:4096")
  })

  test("trims whitespace", () => {
    expect(normalizeServerUrl("  https://opencode.example.com  ")).toBe("https://opencode.example.com")
  })
})

describe("buildAuthHeaders", () => {
  test("returns empty headers without password", () => {
    expect(buildAuthHeaders({ username: "opencode", password: "" })).toEqual({})
  })

  test("builds basic auth header", () => {
    expect(buildAuthHeaders({ username: "opencode", password: "secret" })).toEqual({
      Authorization: "Basic b3BlbmNvZGU6c2VjcmV0",
    })
  })

  test("encodes unicode credentials", () => {
    expect(buildAuthHeaders({ username: "opencode", password: "sëcret" })).toEqual({
      Authorization: "Basic b3BlbmNvZGU6c8OrY3JldA==",
    })
  })
})
