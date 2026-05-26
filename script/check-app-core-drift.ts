import { Glob } from "bun"
import { findForbiddenDirectRoutes } from "./app-core-drift-rules"

const files = [
  ...new Glob("packages/mobile/src/**/*.{ts,tsx}").scanSync("."),
  ...new Glob("packages/app/src/pages/session/**/*.{ts,tsx}").scanSync("."),
  ...new Glob("packages/app/src/utils/*.{ts,tsx}").scanSync("."),
]

const issues = files.flatMap((file) => findForbiddenDirectRoutes(file, Bun.file(file).textSync()))

if (issues.length) {
  console.error("app-core drift check failed")
  for (const issue of issues) console.error(`${issue.file}: ${issue.endpoint} - ${issue.reason}`)
  process.exit(1)
}

console.log("app-core drift check passed")
