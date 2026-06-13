import { describe, expect, test } from "bun:test"
import { shouldUseDesktopV2Header } from "./session-header-helpers"

describe("shouldUseDesktopV2Header", () => {
  test("uses V2 header only on desktop with new layout enabled", () => {
    expect(shouldUseDesktopV2Header("desktop", true)).toBe(true)
    expect(shouldUseDesktopV2Header("desktop", false)).toBe(false)
    expect(shouldUseDesktopV2Header("web", true)).toBe(false)
  })
})
