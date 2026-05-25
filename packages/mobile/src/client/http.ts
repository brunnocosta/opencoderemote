import { buildAuthHeaders, normalizeServerUrl } from "./auth"
import type { Connection, OpencodeApi } from "./types"

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>

export function createOpencodeHttpClient(connection: Connection, fetcher: FetchLike = fetch): OpencodeApi {
  const base = normalizeServerUrl(connection.url)

  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const response = await fetcher(`${base}${path}`, {
      method,
      headers: {
        accept: "application/json",
        ...(body === undefined ? {} : { "content-type": "application/json" }),
        ...buildAuthHeaders(connection),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    if (!response.ok) throw new Error(`${method} ${path} failed with ${response.status}`)
    if (response.status === 204) return undefined as T
    return response.json() as Promise<T>
  }

  return {
    health: () => request("GET", "/global/health"),
    listSessions: () => request("GET", "/session"),
    createSession: (title) => request("POST", "/session", title ? { title } : {}),
    listMessages: (sessionID) => request("GET", `/session/${encodeURIComponent(sessionID)}/message`),
    sendPrompt: (sessionID, text) =>
      request("POST", `/session/${encodeURIComponent(sessionID)}/prompt_async`, {
        parts: [{ type: "text", text }],
      }),
    listFiles: (path = ".") => request("GET", `/file?path=${encodeURIComponent(path)}`),
    readFile: (path) => request("GET", `/file/content?path=${encodeURIComponent(path)}`),
    getDiff: (sessionID) => request("GET", `/session/${encodeURIComponent(sessionID)}/diff`),
    respondPermission: (_sessionID, permissionID, response) =>
      request("POST", `/permission/${encodeURIComponent(permissionID)}/reply`, { reply: response }),
  }
}
