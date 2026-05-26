import { describe, expect, test } from "bun:test"
import { buildAuthHeaders, normalizeServerUrl } from "./auth"

describe("normalizeServerUrl", () => {
  test("trims and removes trailing slashes", () => {
    expect(normalizeServerUrl("  http://localhost:4096/// ")).toBe("http://localhost:4096")
  })
})

describe("buildAuthHeaders", () => {
  test("returns empty object without password", () => {
    expect(buildAuthHeaders({ username: "opencode", password: "" })).toEqual({})
  })

  test("builds default username basic auth", () => {
    expect(buildAuthHeaders({ password: "secret" })).toEqual({ Authorization: "Basic b3BlbmNvZGU6c2VjcmV0" })
  })
})
