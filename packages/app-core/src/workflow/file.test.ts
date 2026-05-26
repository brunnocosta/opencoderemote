import { describe, expect, test } from "bun:test"
import { getParentPath, isDirectoryNode } from "./file"

describe("getParentPath", () => {
  test("handles slash paths", () => {
    expect(getParentPath("src/foo/bar.ts")).toBe("src/foo")
  })

  test("handles windows paths", () => {
    expect(getParentPath("src\\foo\\bar.ts")).toBe("src\\foo")
  })

  test("returns dot at root", () => {
    expect(getParentPath("foo.ts")).toBe(".")
  })
})

describe("isDirectoryNode", () => {
  test("detects directory shapes", () => {
    expect(isDirectoryNode({ type: "directory" })).toBe(true)
    expect(isDirectoryNode({ isDirectory: true })).toBe(true)
    expect(isDirectoryNode({ type: "file" })).toBe(false)
  })
})
