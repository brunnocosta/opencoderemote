import { describe, expect, test } from "bun:test"
import { createOpencodeHttpClient } from "./http"

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  })
}

describe("createOpencodeHttpClient", () => {
  test("calls health endpoint", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = []
    const client = createOpencodeHttpClient({ url: "http://localhost:4096/" }, async (url, init) => {
      calls.push({ url, init })
      return jsonResponse({ healthy: true, version: "1.0.0" })
    })

    expect(await client.health()).toEqual({ healthy: true, version: "1.0.0" })
    expect(calls[0]!.url).toBe("http://localhost:4096/global/health")
  })

  test("uses current permission reply endpoint", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = []
    const client = createOpencodeHttpClient({ url: "http://localhost:4096" }, async (url, init) => {
      calls.push({ url, init })
      return jsonResponse(true)
    })

    expect(await client.respondPermission("req_1", "once")).toBe(true)
    expect(calls[0]!.url).toBe("http://localhost:4096/permission/req_1/reply")
    expect(calls[0]!.init?.body).toBe(JSON.stringify({ reply: "once" }))
  })
})
