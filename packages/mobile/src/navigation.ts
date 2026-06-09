import { bundledWebAssetPrefix } from "./webview-bridge"

export type NavigationAction =
  | { type: "allow" }
  | { type: "external"; url: string }

export type BackAction = "system" | "webview-back" | "show-webview"

export function getNavigationAction(url: string): NavigationAction {
  if (url.startsWith(bundledWebAssetPrefix)) return { type: "allow" }
  if (!url.startsWith("http://") && !url.startsWith("https://")) return { type: "allow" }
  return { type: "external", url }
}

export function getBackAction(state: { canGoBack: boolean; showingConnection: boolean; hasConnection?: boolean }): BackAction {
  if (state.showingConnection && state.hasConnection) return "show-webview"
  if (state.canGoBack && !state.showingConnection) return "webview-back"
  return "system"
}
