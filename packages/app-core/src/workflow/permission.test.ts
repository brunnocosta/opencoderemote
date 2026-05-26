import { describe, expect, test } from "bun:test"
import { mapPermissionButtonToReply } from "./permission"

describe("mapPermissionButtonToReply", () => {
  test("maps allow once", () => {
    expect(mapPermissionButtonToReply("allow")).toBe("once")
  })

  test("maps deny", () => {
    expect(mapPermissionButtonToReply("deny")).toBe("reject")
  })
})
