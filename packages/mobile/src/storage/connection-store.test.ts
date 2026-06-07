import { describe, expect, test } from "bun:test"
import { createConnectionStore } from "./connection-store"

describe("createConnectionStore", () => {
  test("saves and loads connection", async () => {
    const values = new Map<string, string>()
    const store = createConnectionStore({
      getItemAsync: async (key) => values.get(key) ?? null,
      setItemAsync: async (key, value) => void values.set(key, value),
      deleteItemAsync: async (key) => void values.delete(key),
    })

    await store.save({ url: "http://localhost:4096", username: "opencode", password: "secret" })
    expect(await store.load()).toEqual({ url: "http://localhost:4096", username: "opencode", password: "secret" })
  })

  test("returns undefined without saved connection", async () => {
    const store = createConnectionStore({
      getItemAsync: async () => null,
      setItemAsync: async () => undefined,
      deleteItemAsync: async () => undefined,
    })

    expect(await store.load()).toBeUndefined()
  })

  test("clears saved connection", async () => {
    const values = new Map<string, string>()
    const store = createConnectionStore({
      getItemAsync: async (key) => values.get(key) ?? null,
      setItemAsync: async (key, value) => void values.set(key, value),
      deleteItemAsync: async (key) => void values.delete(key),
    })

    await store.save({ url: "http://localhost:4096" })
    await store.clear()

    expect(await store.load()).toBeUndefined()
  })

  test("returns undefined for invalid saved JSON", async () => {
    const store = createConnectionStore({
      getItemAsync: async () => "not-json",
      setItemAsync: async () => undefined,
      deleteItemAsync: async () => undefined,
    })

    expect(await store.load()).toBeUndefined()
  })

  test.each([
    "null",
    "[]",
    JSON.stringify({}),
    JSON.stringify({ url: 4096 }),
    JSON.stringify({ url: "http://localhost:4096", username: 1 }),
    JSON.stringify({ url: "http://localhost:4096", password: 1 }),
    JSON.stringify({ url: "http://localhost:4096", trustedLocal: "yes" }),
  ])("returns undefined for invalid saved connection %s", async (value: string) => {
    const store = createConnectionStore({
      getItemAsync: async () => value,
      setItemAsync: async () => undefined,
      deleteItemAsync: async () => undefined,
    })

    expect(await store.load()).toBeUndefined()
  })
})
