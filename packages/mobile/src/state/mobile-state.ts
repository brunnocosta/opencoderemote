import type { Connection, PermissionRequest, SessionMessage } from "../client/types"

export type MobileState = {
  connection?: Connection
  version?: string
  selectedSessionID?: string
  messages: Record<string, SessionMessage[]>
  permissions: PermissionRequest[]
  error?: string
}

export type MobileAction =
  | { type: "connected"; connection: Connection; version: string }
  | { type: "connection.failed"; error: string }
  | { type: "session.selected"; sessionID: string }
  | { type: "session.cleared" }
  | { type: "messages.loaded"; sessionID: string; messages: SessionMessage[] }
  | { type: "permission.requested"; request: PermissionRequest }
  | { type: "permission.responded"; requestID: string }

export const initialMobileState: MobileState = {
  messages: {},
  permissions: [],
}

export function reduceMobileState(state: MobileState, action: MobileAction): MobileState {
  if (action.type === "connected") return { ...state, connection: action.connection, version: action.version, error: undefined }
  if (action.type === "connection.failed") return { ...state, error: action.error }
  if (action.type === "session.selected") return { ...state, selectedSessionID: action.sessionID }
  if (action.type === "session.cleared") return { ...state, selectedSessionID: undefined }
  if (action.type === "messages.loaded") return { ...state, messages: { ...state.messages, [action.sessionID]: action.messages } }
  if (action.type === "permission.requested") {
    return {
      ...state,
      permissions: state.permissions.some((item) => item.requestID === action.request.requestID)
        ? state.permissions.map((item) => (item.requestID === action.request.requestID ? action.request : item))
        : [...state.permissions, action.request],
    }
  }
  if (action.type === "permission.responded") {
    return { ...state, permissions: state.permissions.filter((item) => item.requestID !== action.requestID) }
  }
  return state
}
