import { describe, expect, test } from "bun:test"
import { decodeTerminalMessage, terminalWriter } from "./terminal-writer"

describe("decodeTerminalMessage", () => {
  test("decodes text websocket frames", () => {
    expect(decodeTerminalMessage("hello")).toEqual({ type: "data", data: "hello" })
  })

  test("decodes binary websocket output as utf-8", () => {
    expect(decodeTerminalMessage(new TextEncoder().encode("olá").buffer)).toEqual({ type: "data", data: "olá" })
  })

  test("decodes binary control frames", () => {
    expect(decodeTerminalMessage(new Uint8Array([0, ...new TextEncoder().encode(JSON.stringify({ cursor: 12 }))]).buffer)).toEqual({
      type: "control",
      cursor: 12,
    })
  })
})

describe("terminalWriter", () => {
  test("buffers and flushes once per schedule", () => {
    const calls: string[] = []
    const scheduled: VoidFunction[] = []
    const writer = terminalWriter(
      (data, done) => {
        calls.push(data)
        done?.()
      },
      (flush) => scheduled.push(flush),
    )

    writer.push("a")
    writer.push("b")
    writer.push("c")

    expect(calls).toEqual([])
    expect(scheduled).toHaveLength(1)

    scheduled[0]?.()
    expect(calls).toEqual(["abc"])
  })

  test("flush is a no-op when empty", () => {
    const calls: string[] = []
    const writer = terminalWriter(
      (data, done) => {
        calls.push(data)
        done?.()
      },
      (flush) => flush(),
    )
    writer.flush()
    expect(calls).toEqual([])
  })

  test("flush waits for pending write completion", () => {
    const calls: string[] = []
    let done: VoidFunction | undefined
    const writer = terminalWriter(
      (data, finish) => {
        calls.push(data)
        done = finish
      },
      (flush) => flush(),
    )

    writer.push("a")

    let settled = false
    writer.flush(() => {
      settled = true
    })

    expect(calls).toEqual(["a"])
    expect(settled).toBe(false)

    done?.()
    expect(settled).toBe(true)
  })
})
