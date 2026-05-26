import type { FileContent, FileDiff, FileNode, Session } from "@opencode-ai/sdk/client"
import { buildAuthHeaders, type Connection, normalizeServerUrl } from "./auth"

export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>

export type Health = {
  healthy: true
  version: string
}

export type SessionMessage = {
  info: {
    id: string
    sessionID: string
    role: string
    time: { created: number }
  }
  parts: Array<{ id?: string; type: string; text?: string; [key: string]: unknown }>
}

export type PermissionReply = "once" | "always" | "reject"

export type OpencodeApi = {
  health(): Promise<Health>
  listSessions(): Promise<Session[]>
  createSession(title?: string): Promise<Session>
  listMessages(sessionID: string): Promise<SessionMessage[]>
  sendPrompt(sessionID: string, text: string): Promise<void>
  listFiles(path?: string): Promise<FileNode[]>
  readFile(path: string): Promise<FileContent>
  getDiff(sessionID: string): Promise<FileDiff[]>
  respondPermission(requestID: string, reply: PermissionReply): Promise<boolean>
}

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
    respondPermission: (requestID, reply) => request("POST", `/permission/${encodeURIComponent(requestID)}/reply`, { reply }),
  }
}
