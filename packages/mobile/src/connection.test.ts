import { describe, expect, test } from "bun:test"
import {
  buildAuthHeader,
  connectionToForm,
  getConnectionValidation,
  normalizeConnection,
  normalizeConnectionForm,
  normalizeServerUrl,
  parseConnection,
  type ConnectionForm,
} from "./connection"

describe("normalizeServerUrl", () => {
  test("adds http protocol and removes trailing slashes", () => {
    expect(normalizeServerUrl(" 192.168.1.10:4096/// ")).toBe("http://192.168.1.10:4096")
  })

  test("keeps explicit https protocol", () => {
    expect(normalizeServerUrl(" https://example.com/ ")).toBe("https://example.com")
  })
})

describe("normalizeConnection", () => {
  test("trims username and preserves optional password", () => {
    expect(normalizeConnection({ url: "localhost:4096", username: " opencode ", password: "" })).toEqual({
      url: "http://localhost:4096",
      username: "opencode",
      password: undefined,
    })
  })

  test("does not require password", () => {
    expect(normalizeConnection({ url: "localhost:4096", username: "opencode" })).toEqual({
      url: "http://localhost:4096",
      username: "opencode",
      password: undefined,
    })
  })
})

describe("normalizeConnectionForm", () => {
  test("normalizes form values into a connection", () => {
    const form: ConnectionForm = { url: " 10.0.0.2:4096/ ", username: " opencode ", password: " secret " }
    expect(normalizeConnectionForm(form)).toEqual({
      url: "http://10.0.0.2:4096",
      username: "opencode",
      password: " secret ",
    })
  })
})

describe("connectionToForm", () => {
  test("prefills missing username and optional password", () => {
    expect(connectionToForm({ url: "http://localhost:4096" })).toEqual({
      url: "http://localhost:4096",
      username: "opencode",
      password: "",
    })
  })
})

describe("getConnectionValidation", () => {
  test("requires server URL", () => {
    expect(getConnectionValidation({ url: " ", username: "opencode", password: "" })).toBe("Server URL is required")
  })

  test("accepts URL without password", () => {
    expect(getConnectionValidation({ url: "localhost:4096", username: "opencode", password: "" })).toBeUndefined()
  })
})

describe("parseConnection", () => {
  test("loads valid connection json", () => {
    expect(parseConnection(JSON.stringify({ url: "http://localhost:4096", username: "opencode" }))).toEqual({
      url: "http://localhost:4096",
      username: "opencode",
    })
  })

  test("ignores invalid connection json", () => {
    expect(parseConnection("not-json")).toBeUndefined()
    expect(parseConnection(JSON.stringify({ url: 4096 }))).toBeUndefined()
  })
})

describe("buildAuthHeader", () => {
  test("returns undefined without password", () => {
    expect(buildAuthHeader({ url: "http://localhost:4096", username: "opencode" })).toBeUndefined()
  })

  test("builds basic auth when username and password exist", () => {
    expect(buildAuthHeader({ url: "http://localhost:4096", username: "opencode", password: "secret" })).toBe(`Basic ${btoa("opencode:secret")}`)
  })

  test("builds UTF-8-safe basic auth for non-ASCII credentials", () => {
    expect(buildAuthHeader({ url: "http://localhost:4096", username: "opencodé", password: "secrêt" })).toBe("Basic b3BlbmNvZMOpOnNlY3LDqnQ=")
  })
})
