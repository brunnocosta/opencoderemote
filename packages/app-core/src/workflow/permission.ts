import type { PermissionReply } from "../client/http"

export type PermissionButton = "allow" | "always" | "deny"

export function mapPermissionButtonToReply(button: PermissionButton): PermissionReply {
  if (button === "allow") return "once"
  if (button === "always") return "always"
  return "reject"
}
