type RecordValue = Record<string, unknown>

const isRecord = (value: unknown): value is RecordValue => {
  return typeof value === "object" && value !== null
}

export const isDisposable = (value: unknown): value is { dispose: () => void } => {
  return isRecord(value) && typeof value.dispose === "function"
}

export const disposeIfDisposable = (value: unknown) => {
  if (!isDisposable(value)) return
  value.dispose()
}

export const hasSetOption = (value: unknown): value is { setOption: (key: string, next: unknown) => void } => {
  return isRecord(value) && typeof value.setOption === "function"
}

export const setOptionIfSupported = (value: unknown, key: string, next: unknown) => {
  if (!hasSetOption(value)) return
  value.setOption(key, next)
}

export const configureTerminalTextarea = (textarea: HTMLTextAreaElement | undefined) => {
  if (!textarea) return
  textarea.setAttribute("inputmode", "text")
  textarea.autocapitalize = "none"
  textarea.autocomplete = "off"
  textarea.spellcheck = false
  textarea.style.fontSize = "16px"
  textarea.style.transform = "translateY(-100vh)"
  textarea.style.opacity = "0.01"
  textarea.style.clipPath = "none"
}

export const getHoveredLinkText = (value: unknown) => {
  if (!isRecord(value)) return
  const link = value.currentHoveredLink
  if (!isRecord(link)) return
  if (typeof link.text !== "string") return
  return link.text
}

export const getSpeechRecognitionCtor = <T>(value: unknown): (new () => T) | undefined => {
  if (!isRecord(value)) return
  const ctor =
    typeof value.webkitSpeechRecognition === "function" ? value.webkitSpeechRecognition : value.SpeechRecognition
  if (typeof ctor !== "function") return
  return ctor as new () => T
}
