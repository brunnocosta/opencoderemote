import { rm } from "node:fs/promises"
import path from "node:path"

const mobileDir = path.join(import.meta.dir, "..")

await Promise.all(
  [
    path.join(mobileDir, "android", ".gradle"),
    path.join(mobileDir, "android", "build"),
    path.join(mobileDir, "android", "app", ".cxx"),
    path.join(mobileDir, "android", "app", "build"),
    path.join(mobileDir, "node_modules", "react-native-screens"),
  ].map((target) => rm(target, { recursive: true, force: true })),
)

console.log("Cleaned stale Android native artifacts")
