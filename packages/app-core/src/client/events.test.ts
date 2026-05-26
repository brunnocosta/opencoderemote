import { describe, expect, test } from "bun:test"
import { createEventRequest, createSseParser, getReconnectDelay, parseSseChunk } from "./events"

describe("parseSseChunk", () => {
  test("parses complete json event", () => {
    expect(parseSseChunk('event: message\ndata: {"type":"server.connected"}\n\n')).toEqual([
      { event: "message", data: { type: "server.connected" } },
    ])
  })

  test("supports crlf frames", () => {
    expect(parseSseChunk('data: {"type":"a"}\r\n\r\ndata: {"type":"b"}\r\n\r\n')).toEqual([
      { event: "message", data: { type: "a" } },
      { event: "message", data: { type: "b" } },
    ])
  })

  test("buffers partial frames", () => {
    const parser = createSseParser()
    expect(parser.push('data: {"type"')).toEqual([])
    expect(parser.push(':"done"}\n\n')).toEqual([{ event: "message", data: { type: "done" } }])
  })

  test("flush processes remaining buffer", () => {
    const parser = createSseParser()
    expect(parser.push('data: {"type":"incomplete"}')).toEqual([])
    expect(parser.flush()).toEqual([{ event: "message", data: { type: "incomplete" } }])
  })

  test("flush clears buffer", () => {
    const parser = createSseParser()
    parser.push('data: test')
    parser.flush()
    expect(parser.flush()).toEqual([])
  })

  test("flush returns empty array when buffer is empty", () => {
    const parser = createSseParser()
    expect(parser.flush()).toEqual([])
  })
})

describe("createEventRequest", () => {
  test("creates authenticated event request", () => {
    const request = createEventRequest({ url: "http://localhost:4096", password: "secret" })
    expect(request.url).toBe("http://localhost:4096/event")
    expect(request.headers.get("accept")).toBe("text/event-stream")
    expect(request.headers.get("authorization")).toBe("Basic b3BlbmNvZGU6c2VjcmV0")
  })
})

describe("getReconnectDelay", () => {
  test("caps backoff", () => {
    expect(getReconnectDelay(0)).toBe(500)
    expect(getReconnectDelay(20)).toBe(10000)
  })
})
