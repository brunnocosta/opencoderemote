import { cp, mkdir, rm } from "node:fs/promises"
import path from "node:path"

const mobileDir = path.join(import.meta.dir, "..")
const rootDir = path.join(mobileDir, "..", "..")
const appDir = path.join(rootDir, "packages", "app")
const outputDir = path.join(mobileDir, "android", "app", "src", "main", "assets", "opencode-web")

const build = Bun.spawn(["bun", "run", "build"], {
  cwd: appDir,
  env: { ...process.env, OPENCODE_MOBILE_ASSETS: "1" },
  stdout: "inherit",
  stderr: "inherit",
})

const code = await build.exited
if (code !== 0) process.exit(code)

await rm(outputDir, { recursive: true, force: true })
await mkdir(path.dirname(outputDir), { recursive: true })
await cp(path.join(appDir, "dist"), outputDir, { recursive: true })

console.log(`Copied opencode web assets to ${path.relative(rootDir, outputDir)}`)
