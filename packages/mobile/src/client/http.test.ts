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
    const requests: Request[] = []
    const client = createOpencodeHttpClient(
      { url: "http://localhost:4096/" },
      async (request) => {
        requests.push(request)
        return jsonResponse({ healthy: true, version: "1.0.0" })
      },
    )

    expect(await client.health()).toEqual({ healthy: true, version: "1.0.0" })
    expect(requests[0].url).toBe("http://localhost:4096/global/health")
  })

  test("sends basic auth header", async () => {
    const requests: Request[] = []
    const client = createOpencodeHttpClient(
      { url: "http://localhost:4096", username: "opencode", password: "secret" },
      async (request) => {
        requests.push(request)
        return jsonResponse([])
      },
    )

    await client.listSessions()
    expect(requests[0].headers.get("authorization")).toBe("Basic b3BlbmNvZGU6c2VjcmV0")
  })

  test("posts json body", async () => {
    const requests: Request[] = []
    const client = createOpencodeHttpClient({ url: "http://localhost:4096" }, async (request) => {
      requests.push(request)
      return jsonResponse({}, { status: 204 })
    })

    await client.sendPrompt("session/id", "hello")
    expect(requests[0].url).toBe("http://localhost:4096/session/session%2Fid/prompt_async")
    expect(requests[0].headers.get("content-type")).toBe("application/json")
    expect(await requests[0].json()).toEqual({ parts: [{ type: "text", text: "hello" }] })
  })

  test("throws status error", async () => {
    const client = createOpencodeHttpClient({ url: "http://localhost:4096" }, async () => jsonResponse({ error: "no" }, { status: 401 }))
    await expect(client.health()).rejects.toThrow("GET /global/health failed with 401")
  })
})
