import { describe, expect, test } from "bun:test"
import { summarizeDiff } from "./diff"

describe("summarizeDiff", () => {
  test("formats additions and deletions", () => {
    expect(summarizeDiff({ file: "a.ts", additions: 3, deletions: 2 })).toBe("+3 -2")
  })
})
