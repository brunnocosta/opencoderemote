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
  test("calls health endpoint with normalized base URL", async () => {
    const requests: Array<{ input: string; init?: RequestInit }> = []
    const client = createOpencodeHttpClient(
      { url: "http://localhost:4096/" },
      async (input, init) => {
        requests.push({ input, init })
        return jsonResponse({ healthy: true, version: "1.0.0" })
      },
    )

    expect(await client.health()).toEqual({ healthy: true, version: "1.0.0" })
    expect(requests[0]!.input).toBe("http://localhost:4096/global/health")
  })

  test("sends basic auth header", async () => {
    const requests: Array<{ input: string; init?: RequestInit }> = []
    const client = createOpencodeHttpClient(
      { url: "http://localhost:4096", username: "opencode", password: "secret" },
      async (input, init) => {
        requests.push({ input, init })
        return jsonResponse([])
      },
    )

    await client.listSessions()
    expect(new Headers(requests[0]!.init?.headers).get("authorization")).toBe("Basic b3BlbmNvZGU6c2VjcmV0")
  })

  test("posts json body", async () => {
    const requests: Array<{ input: string; init?: RequestInit }> = []
    const client = createOpencodeHttpClient({ url: "http://localhost:4096" }, async (input, init) => {
      requests.push({ input, init })
      return jsonResponse({}, { status: 204 })
    })

    await client.sendPrompt("session/id", "hello")
    expect(requests[0]!.input).toBe("http://localhost:4096/session/session%2Fid/prompt_async")
    expect(new Headers(requests[0]!.init?.headers).get("content-type")).toBe("application/json")
    expect(requests[0]!.init?.body).toBe(JSON.stringify({ parts: [{ type: "text", text: "hello" }] }))
  })

  test("sends permission response to current reply endpoint", async () => {
    const requests: Array<{ input: string; init?: RequestInit }> = []
    const client = createOpencodeHttpClient({ url: "http://localhost:4096" }, async (input, init) => {
      requests.push({ input, init })
      return jsonResponse(true)
    })

    expect(await client.respondPermission("permission/id", "always")).toBe(true)
    expect(requests[0]!.input).toBe("http://localhost:4096/permission/permission%2Fid/reply")
    expect(requests[0]!.init?.body).toBe(JSON.stringify({ reply: "always" }))
  })

  test("throws status error", async () => {
    const client = createOpencodeHttpClient({ url: "http://localhost:4096" }, async () => jsonResponse({ error: "no" }, { status: 401 }))
    await expect(client.health()).rejects.toThrow("GET /global/health failed with 401")
  })
})
