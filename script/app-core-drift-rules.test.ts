import { describe, expect, test } from "bun:test"
import { findEndpointStrings, findForbiddenDirectRoutes } from "./app-core-drift-rules"

describe("findEndpointStrings", () => {
  test("finds opencode endpoint strings", () => {
    expect(findEndpointStrings('request("GET", "/session")\nfetch("/file?path=.")')).toEqual(["/session", "/file?path=."])
  })
})

describe("findForbiddenDirectRoutes", () => {
  test("flags mobile duplicate route", () => {
    expect(findForbiddenDirectRoutes("packages/mobile/src/client/http.ts", 'request("GET", "/session")')).toEqual([
      { file: "packages/mobile/src/client/http.ts", endpoint: "/session", reason: "mobile workflow route should come from @opencode-ai/app-core" },
    ])
  })

  test("allows app-core route owner", () => {
    expect(findForbiddenDirectRoutes("packages/app-core/src/client/http.ts", 'request("GET", "/session")')).toEqual([])
  })
})
