import { createEventRequest, createSseParser } from "@opencode-ai/app-core"
import type { SseMessage } from "@opencode-ai/app-core"
import type { Connection } from "./types"

export { createEventRequest, createSseParser, getReconnectDelay, parseSseChunk } from "@opencode-ai/app-core"
export type { SseMessage } from "@opencode-ai/app-core"

export async function streamEvents(connection: Connection, onMessage: (message: SseMessage) => void, signal?: AbortSignal, fetcher: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> = fetch) {
  const response = await fetcher(createEventRequest(connection, "/event"), { signal })
  if (!response.ok) throw new Error(`GET /event failed with ${response.status}`)
  if (!response.body) return

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  const parser = createSseParser()

  while (!signal?.aborted) {
    const chunk = await reader.read()
    if (chunk.done) {
      for (const message of parser.flush()) onMessage(message)
      return
    }
    for (const message of parser.push(decoder.decode(chunk.value, { stream: true }))) onMessage(message)
  }
}
