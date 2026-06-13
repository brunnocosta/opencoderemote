export function shouldUseDesktopV2Header(platform: "web" | "desktop", newLayoutDesigns: boolean) {
  return platform === "desktop" && newLayoutDesigns
}
