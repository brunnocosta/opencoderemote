import type { FileContent, FileDiff, FileNode, Session } from "@opencode-ai/sdk/client"

export type Connection = {
  url: string
  username?: string
  password?: string
  trustedLocal?: boolean
}

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

export type PermissionDecision = "once" | "always" | "reject"

export type PermissionRequest = {
  sessionID: string
  permissionID: string
  title: string
  metadata?: unknown
}

export type OpencodeApi = {
  health(): Promise<Health>
  listSessions(): Promise<Session[]>
  createSession(title?: string): Promise<Session>
  listMessages(sessionID: string): Promise<SessionMessage[]>
  sendPrompt(sessionID: string, text: string): Promise<void>
  listFiles(path?: string): Promise<FileNode[]>
  readFile(path: string): Promise<FileContent>
  getDiff(sessionID: string): Promise<FileDiff[]>
  respondPermission(sessionID: string, permissionID: string, response: PermissionDecision): Promise<boolean>
}
