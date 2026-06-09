import type { Connection } from "./connection"

export const bundledWebAssetPrefix = "file:///android_asset/opencode-web/"

export function getBundledWebSource() {
  return { uri: `${bundledWebAssetPrefix}index.html#/` }
}

export function getWebViewRuntimeSettings() {
  return {
    androidLayerType: "hardware" as const,
    keyboardDisplayRequiresUserAction: false,
    overScrollMode: "never" as const,
  }
}

export function createBridgeInjection(connection?: Connection) {
  if (!connection) return "true;"
  const json = JSON.stringify(connection)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
  return `window.__OPENCODE__ = Object.assign({}, window.__OPENCODE__, { mobile: { server: ${json} } }); true;`
}

export function isReadyMessage(value: string) {
  return value === "opencode.ready"
}
