import { describe, expect, test } from "bun:test"
import { createEventRequest, createSseParser, getReconnectDelay, parseSseChunk, streamEvents } from "./events"

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

  test("parses CRLF-delimited event", () => {
    expect(parseSseChunk('event: message\r\ndata: {"type":"server.connected"}\r\n\r\n')).toEqual([
      { event: "message", data: { type: "server.connected" } },
    ])
  })

  test("parses multiple CRLF-delimited events", () => {
    expect(parseSseChunk("data: one\r\n\r\nevent: update\r\ndata: two\r\n\r\n")).toEqual([
      { event: "message", data: "one" },
      { event: "update", data: "two" },
    ])
  })

  test("preserves payload spacing except optional single leading field space", () => {
    expect(parseSseChunk("event: custom\ndata:  hello \ndata:   there\n\n")).toEqual([
      { event: "custom", data: " hello \n  there" },
    ])
  })
})

describe("createSseParser", () => {
  test("buffers partial chunks until event is complete", () => {
    const parser = createSseParser()

    expect(parser.push("event: update\ndata: hel")).toEqual([])
    expect(parser.push("lo\n\n")).toEqual([{ event: "update", data: "hello" }])
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
  test("builds event stream request", () => {
    const request = createEventRequest({ url: " http://localhost:4096/ ", password: "secret" })

    expect(request).toBeInstanceOf(Request)
    expect(request.url).toBe("http://localhost:4096/event")
    expect(request.headers.get("accept")).toBe("text/event-stream")
    expect(request.headers.get("Authorization")).toBe("Basic b3BlbmNvZGU6c2VjcmV0")
  })
})

describe("streamEvents", () => {
  test("parses streamed chunks", async () => {
    const messages: unknown[] = []
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('event: message\ndata: {"type":"permission.asked"}\n\n'))
        controller.close()
      },
    })

    await streamEvents({ url: "http://localhost:4096" }, (message) => messages.push(message), undefined, async () => new Response(stream))

    expect(messages).toEqual([{ event: "message", data: { type: "permission.asked" } }])
  })
})
