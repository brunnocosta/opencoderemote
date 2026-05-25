import { describe, expect, test } from "bun:test"
import { getConnectionValidation } from "./connection-validation"

describe("getConnectionValidation", () => {
  test("requires server URL", () => {
    expect(getConnectionValidation({ url: " ", password: "secret", trustedLocal: false })).toBe("Server URL is required")
  })

  test("requires password unless local server is trusted", () => {
    expect(getConnectionValidation({ url: "http://localhost:4096", password: "", trustedLocal: false })).toBe("Password is required unless you trust a local server")
    expect(getConnectionValidation({ url: "http://localhost:4096", password: "", trustedLocal: true })).toBeUndefined()
  })
})
