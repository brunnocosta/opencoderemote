import { buildAuthHeaders, normalizeServerUrl } from "./auth"
import type { Connection } from "./types"

export type SseMessage = {
  event: string
  data: unknown
}

export function parseSseChunk(chunk: string): SseMessage[] {
  return chunk
    .split("\n\n")
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block.split("\n")
      const event = lines.find((line) => line.startsWith("event:"))?.slice("event:".length).trim() || "message"
      const dataText = lines
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice("data:".length).trim())
        .join("\n")
      try {
        return { event, data: JSON.parse(dataText) }
      } catch {
        return { event, data: dataText }
      }
    })
}

export function getReconnectDelay(attempt: number) {
  return Math.min(500 * 2 ** attempt, 10000)
}

export function createEventRequest(connection: Connection, path = "/event") {
  return {
    url: `${normalizeServerUrl(connection.url)}${path}`,
    init: {
      headers: {
        accept: "text/event-stream",
        ...buildAuthHeaders(connection),
      },
    },
  }
}
