export type DriftIssue = {
  file: string
  endpoint: string
  reason: string
}

const ownedEndpoints = [
  "/global/health",
  "/session",
  "/message",
  "/prompt_async",
  "/file",
  "/file/content",
  "/diff",
  "/permission/",
]

export function findEndpointStrings(content: string) {
  return Array.from(content.matchAll(/["'`]((?:\/[a-z][^"'`\s]*)+)["'`]/g))
    .map((match) => match[1])
    .filter((value) => ownedEndpoints.some((endpoint) => value.includes(endpoint)))
}

export function findForbiddenDirectRoutes(file: string, content: string): DriftIssue[] {
  if (file.includes("packages/app-core/")) return []
  if (!file.includes("packages/mobile/") && !file.includes("packages/app/src/pages/session") && !file.includes("packages/app/src/utils")) return []
  return findEndpointStrings(content).map((endpoint) => ({
    file,
    endpoint,
    reason: file.includes("packages/mobile/")
      ? "mobile workflow route should come from @opencode-ai/app-core"
      : "app workflow route should move to @opencode-ai/app-core or be documented as UI-only",
  }))
}
