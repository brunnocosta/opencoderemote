import { describe, expect, test } from "bun:test"
import { initialMobileState, reduceMobileState } from "./mobile-state"

describe("reduceMobileState", () => {
  test("connects", () => {
    const state = reduceMobileState(initialMobileState, {
      type: "connected",
      connection: { url: "http://localhost:4096" },
      version: "1.0.0",
    })
    expect(state.connection?.url).toBe("http://localhost:4096")
    expect(state.version).toBe("1.0.0")
  })

  test("selects session", () => {
    const state = reduceMobileState(initialMobileState, { type: "session.selected", sessionID: "ses_1" })
    expect(state.selectedSessionID).toBe("ses_1")
  })

  test("tracks pending permission", () => {
    const state = reduceMobileState(initialMobileState, {
      type: "permission.requested",
      request: { sessionID: "ses_1", permissionID: "perm_1", title: "Run command" },
    })
    expect(state.permissions).toHaveLength(1)
  })

  test("removes permission response", () => {
    const requested = reduceMobileState(initialMobileState, {
      type: "permission.requested",
      request: { sessionID: "ses_1", permissionID: "perm_1", title: "Run command" },
    })
    const responded = reduceMobileState(requested, { type: "permission.responded", permissionID: "perm_1" })
    expect(responded.permissions).toEqual([])
  })
})
