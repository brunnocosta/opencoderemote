import { describe, expect, test } from "bun:test"
import { createEventRequest, getReconnectDelay, parseSseChunk } from "./events"

describe("parseSseChunk", () => {
  test("parses event and json data", () => {
    expect(parseSseChunk('event: message\ndata: {"type":"server.connected"}\n\n')).toEqual([
      { event: "message", data: { type: "server.connected" } },
    ])
  })

  test("ignores empty chunks", () => {
    expect(parseSseChunk("\n\n")).toEqual([])
  })

  test("keeps text data when json parse fails", () => {
    expect(parseSseChunk("data: hello\n\n")).toEqual([{ event: "message", data: "hello" }])
  })
})

describe("getReconnectDelay", () => {
  test("backs off to max delay", () => {
    expect(getReconnectDelay(0)).toBe(500)
    expect(getReconnectDelay(4)).toBe(8000)
    expect(getReconnectDelay(20)).toBe(10000)
  })
})

describe("createEventRequest", () => {
  test("builds React Native fetch input and init", () => {
    expect(createEventRequest({ url: " http://localhost:4096/ ", password: "secret" })).toEqual({
      url: "http://localhost:4096/event",
      init: {
        headers: {
          accept: "text/event-stream",
          Authorization: "Basic b3BlbmNvZGU6c2VjcmV0",
        },
      },
    })
  })
})
