import { expect, test } from "bun:test"
import fs from "node:fs"
import path from "node:path"

test("web assets build forces production mode", () => {
  const script = fs.readFileSync(path.join(import.meta.dir, "..", "script", "build-web-assets.ts"), "utf8")

  expect(script).toContain('NODE_ENV: "production"')
  expect(script).toContain('OPENCODE_CHANNEL: "prod"')
})
