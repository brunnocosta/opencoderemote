import { describe, expect, test } from "bun:test"
import { checkServerHealth } from "./health"

describe("checkServerHealth", () => {
  test("returns ok for successful response", async () => {
    const result = await checkServerHealth(
      { url: "http://localhost:4096" },
      async () => new Response(JSON.stringify({ ok: true }), { status: 200 }),
    )

    expect(result).toEqual({ ok: true })
  })

  test("returns error for non-ok response", async () => {
    const result = await checkServerHealth(
      { url: "http://localhost:4096" },
      async () => new Response("nope", { status: 503, statusText: "Service Unavailable" }),
    )

    expect(result).toEqual({ ok: false, message: "Server health check failed: 503 Service Unavailable" })
  })

  test("returns error for network failure", async () => {
    const result = await checkServerHealth({ url: "http://localhost:4096" }, async () => {
      throw new Error("Network request failed")
    })

    expect(result).toEqual({ ok: false, message: "Network request failed" })
  })

  test("sends auth header only when password exists", async () => {
    const requests: Array<RequestInit | undefined> = []

    await checkServerHealth({ url: "http://localhost:4096", username: "opencode" }, async (_url, init) => {
      requests.push(init)
      return new Response("{}", { status: 200 })
    })

    await checkServerHealth({ url: "http://localhost:4096", username: "opencode", password: "secret" }, async (_url, init) => {
      requests.push(init)
      return new Response("{}", { status: 200 })
    })

    expect(requests[0]?.headers).toEqual(undefined)
    expect(requests[1]?.headers).toEqual({ authorization: `Basic ${btoa("opencode:secret")}` })
  })
})
