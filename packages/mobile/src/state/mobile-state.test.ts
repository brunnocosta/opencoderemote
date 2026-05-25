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

  test("clears selected session", () => {
    const selected = reduceMobileState(initialMobileState, { type: "session.selected", sessionID: "ses_1" })
    const state = reduceMobileState(selected, { type: "session.cleared" })
    expect(state.selectedSessionID).toBeUndefined()
  })

  test("tracks pending permission", () => {
    const state = reduceMobileState(initialMobileState, {
      type: "permission.requested",
      request: { sessionID: "ses_1", permissionID: "perm_1", title: "Run command" },
    })
    expect(state.permissions).toHaveLength(1)
  })

  test("replaces duplicate permission request", () => {
    const requested = reduceMobileState(initialMobileState, {
      type: "permission.requested",
      request: { sessionID: "ses_1", permissionID: "perm_1", title: "Run command" },
    })
    const replaced = reduceMobileState(requested, {
      type: "permission.requested",
      request: { sessionID: "ses_2", permissionID: "perm_1", title: "Read file" },
    })

    expect(replaced.permissions).toEqual([{ sessionID: "ses_2", permissionID: "perm_1", title: "Read file" }])
  })

  test("keeps state immutable when replacing permission request", () => {
    const permission = { sessionID: "ses_1", permissionID: "perm_1", title: "Run command" }
    const state = { ...initialMobileState, permissions: [permission] }
    const replaced = reduceMobileState(state, {
      type: "permission.requested",
      request: { sessionID: "ses_2", permissionID: "perm_1", title: "Read file" },
    })

    expect(replaced).not.toBe(state)
    expect(replaced.permissions).not.toBe(state.permissions)
    expect(state.permissions).toEqual([permission])
    expect(replaced.permissions[0]).not.toBe(permission)
  })

  test("preserves unrelated permission references when replacing permission request", () => {
    const permission = { sessionID: "ses_1", permissionID: "perm_1", title: "Run command" }
    const replacement = { sessionID: "ses_2", permissionID: "perm_2", title: "Read file" }
    const state = { ...initialMobileState, permissions: [permission, { sessionID: "ses_old", permissionID: "perm_2", title: "Old" }] }
    const replaced = reduceMobileState(state, { type: "permission.requested", request: replacement })

    expect(replaced.permissions).toEqual([permission, replacement])
    expect(replaced.permissions[0]).toBe(permission)
    expect(replaced.permissions[1]).toBe(replacement)
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
