import { buildAuthHeaders, normalizeServerUrl, type Connection } from "./auth"

export type SseMessage = {
  event: string
  data: unknown
}

export class SseParser {
  private buffer = ""

  push(chunk: string): SseMessage[] {
    this.buffer += chunk
    const messages: SseMessage[] = []
    const delimiter = /(?:\r\n|\r|\n){2}/

    while (true) {
      const match = delimiter.exec(this.buffer)
      if (!match) return messages
      const message = parseSseBlock(this.buffer.slice(0, match.index))
      this.buffer = this.buffer.slice(match.index + match[0].length)
      if (message) messages.push(message)
    }
  }

  flush(): SseMessage[] {
    if (!this.buffer) return []
    const message = parseSseBlock(this.buffer)
    this.buffer = ""
    return message ? [message] : []
  }
}

export function createSseParser() {
  return new SseParser()
}

export function parseSseChunk(chunk: string): SseMessage[] {
  return createSseParser().push(chunk)
}

export function getReconnectDelay(attempt: number) {
  return Math.min(500 * 2 ** attempt, 10000)
}

export function createEventRequest(connection: Connection, path = "/event") {
  const headers = new Headers(buildAuthHeaders(connection))
  headers.set("accept", "text/event-stream")
  return new Request(`${normalizeServerUrl(connection.url)}${path}`, { headers })
}

function parseSseBlock(block: string): SseMessage | undefined {
  const lines = block.split(/\r\n|\r|\n/)
  if (lines.every((line) => line === "")) return undefined

  const event = lines
    .map(parseField)
    .find((field) => field.name === "event")?.value || "message"
  const dataText = lines
    .map(parseField)
    .filter((field) => field.name === "data")
    .map((field) => field.value)
    .join("\n")

  try {
    return { event, data: JSON.parse(dataText) }
  } catch {
    return { event, data: dataText }
  }
}

function parseField(line: string) {
  const separator = line.indexOf(":")
  if (separator === -1) return { name: line, value: "" }
  const value = line.slice(separator + 1)
  return {
    name: line.slice(0, separator),
    value: value.startsWith(" ") ? value.slice(1) : value,
  }
}
