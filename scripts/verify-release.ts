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
const importPatterns = [
  /(from\s+["'])([^"']+)(["'])/g,
  /(import\s+["'])([^"']+)(["'])/g,
  /(import\s*\(\s*["'])([^"']+)(["']\s*\))/g,
  /(require\s*\(\s*["'])([^"']+)(["']\s*\))/g,
]
const importSpecifiers = new Set<string>()
for (const pattern of importPatterns) {
  for (const match of contents.matchAll(pattern)) importSpecifiers.add(match[2]!)
}

for (const dependency of ["mathjax-full", "mhchemparser"]) {
  if ([...importSpecifiers].some((specifier) => specifier === dependency || specifier.startsWith(`${dependency}/`))) {
    throw new Error(`MathJax dependency was not bundled into tui.js: ${dependency}`)
  }
}
for (const specifier of ["@opentui/core", "@opentui/solid", "solid-js"]) {
  if (!importSpecifiers.has(specifier)) {
    throw new Error(`Release must retain a scanner-visible host import: ${specifier}`)
  }
}
if (contents.includes("@opencode/plugin/tui")) throw new Error("Release must not create a second PluginContext")

const archiveContents = new TextDecoder().decode(
  await new Response(Bun.spawn(["tar", "-tzf", archive]).stdout).arrayBuffer(),
)
if (!archiveContents.includes("artifact-canvas/tui.js\n")) throw new Error("Archive does not contain the TUI entrypoint")
if (archiveContents.includes("server.ts") || archiveContents.includes("tui.tsx")) {
  throw new Error("Archive contains development source")
}

process.stdout.write("Release archive is installable on Linux x64 glibc.\n")
