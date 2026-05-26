export function getMessageText(message: { info?: { role?: string }; parts: Array<{ text?: string }> }) {
  return message.parts.map((part) => part.text).filter(Boolean).join("\n") || message.info?.role || "message"
}
