import { Glob } from "bun"
import { findEndpointStrings } from "./app-core-drift-rules"

const base = process.argv[2] || "origin/dev"
const changed = new Set(
  await new Response(Bun.spawnSync(["git", "diff", "--name-only", `${base}...HEAD`]).stdout).text().then((value) => value.split("\n").filter(Boolean)),
)

const watched = Array.from(changed).filter(
  (file) => file.startsWith("packages/app/src/pages/session/") || file.startsWith("packages/app/src/utils/") || file.startsWith("packages/mobile/src/") || file.startsWith("packages/app-core/src/"),
)

const allWatched = [
  ...new Glob("packages/app/src/pages/session/**/*.{ts,tsx}").scanSync("."),
  ...new Glob("packages/app/src/utils/*.{ts,tsx}").scanSync("."),
  ...new Glob("packages/mobile/src/**/*.{ts,tsx}").scanSync("."),
  ...new Glob("packages/app-core/src/**/*.ts").scanSync("."),
]

const endpoints = allWatched.flatMap((file) => findEndpointStrings(Bun.file(file).textSync()).map((endpoint) => ({ file, endpoint })))

console.log("# app-core sync report")
console.log("")
console.log(`Base: ${base}`)
console.log("")
console.log("## Changed watched files")
for (const file of watched) console.log(`- ${file}`)
if (!watched.length) console.log("- none")
console.log("")
console.log("## Observed endpoint strings")
for (const item of endpoints) console.log(`- ${item.endpoint} in ${item.file}`)
if (!endpoints.length) console.log("- none")
console.log("")
console.log("## Review targets")
console.log("- packages/app-core/src/client")
console.log("- packages/app-core/src/workflow")
console.log("- packages/mobile/src/client")
console.log("- packages/mobile/src/ui")
