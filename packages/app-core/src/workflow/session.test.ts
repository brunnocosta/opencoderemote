import { describe, expect, test } from "bun:test"
import { getMessageText } from "./session"

describe("getMessageText", () => {
  test("joins text parts", () => {
    expect(getMessageText({ parts: [{ text: "a" }, { text: "b" }] })).toBe("a\nb")
  })

  test("falls back to role", () => {
    expect(getMessageText({ info: { role: "assistant" }, parts: [] })).toBe("assistant")
  })
})
