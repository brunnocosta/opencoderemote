export function getParentPath(value: string) {
  const index = Math.max(value.lastIndexOf("/"), value.lastIndexOf("\\"))
  if (index <= 0) return "."
  return value.slice(0, index)
}

export function isDirectoryNode(node: unknown) {
  if (!node || typeof node !== "object") return false
  const value = node as { type?: unknown; isDirectory?: unknown }
  return value.type === "directory" || value.isDirectory === true
}
