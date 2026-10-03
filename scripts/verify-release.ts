import { readdir, stat } from "node:fs/promises"
import path from "node:path"

const root = path.resolve(import.meta.dir, "..")
const distribution = path.join(root, "dist")
const output = path.join(distribution, "artifact-canvas")
const archive = path.join(distribution, "artifact-canvas-linux-x64-glibc.tar.gz")

const required = [
  "package.json",
  "tui.js",
  "LICENSE",
  "LICENSES/NOTICE.md",
  "node_modules/@resvg/resvg-js/index.js",
  "node_modules/@resvg/resvg-js/js-binding.js",
  "node_modules/@resvg/resvg-js-linux-x64-gnu/resvgjs.linux-x64-gnu.node",
]
for (const relative of required) {
  try {
    await stat(path.join(output, relative))
  } catch {
    throw new Error(`Release is missing ${relative}`)
  }
}

const names = await readdir(output)
for (const forbidden of ["src", "test", "server.ts", "tui.tsx", "bun.lock"]) {
  if (names.includes(forbidden)) throw new Error(`Release must not contain ${forbidden}`)
}

const manifest = (await Bun.file(path.join(output, "package.json")).json()) as { type?: string }
if (manifest.type !== "module") throw new Error("Release manifest must be an ESM package")

const contents = await Bun.file(path.join(output, "tui.js")).text()
if (contents.includes("mathjax-full") || contents.includes("mhchemparser")) {
  throw new Error("MathJax dependencies were not bundled into tui.js")
}
for (const specifier of ["@opencode/plugin/tui", "@opentui/core", "@opentui/solid", "solid-js"]) {
  if (!contents.includes(specifier)) throw new Error(`Release must retain the host import ${specifier}`)
}

const archiveContents = new TextDecoder().decode(
  await new Response(Bun.spawn(["tar", "-tzf", archive]).stdout).arrayBuffer(),
)
if (!archiveContents.includes("artifact-canvas/tui.js\n")) throw new Error("Archive does not contain the TUI entrypoint")
if (archiveContents.includes("server.ts") || archiveContents.includes("tui.tsx")) {
  throw new Error("Archive contains development source")
}

process.stdout.write("Release archive is installable on Linux x64 glibc.\n")
