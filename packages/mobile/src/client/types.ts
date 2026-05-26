export type { Connection, Health, OpencodeApi, PermissionReply, SessionMessage } from "@opencode-ai/app-core"

export type PermissionRequest = {
  sessionID: string
  requestID: string
  title: string
  metadata?: unknown
}
