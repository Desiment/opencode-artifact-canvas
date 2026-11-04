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
  "LICENSES/opentui-markdown-render.txt",
  "LICENSES/opentui-markdown-render-NOTICE.txt",
  "LICENSES/dagre.txt",
  "LICENSES/graphlib.txt",
  "LICENSES/entities.txt",
  "LICENSES/gifuct-js.txt",
  "LICENSES/js-binary-schema-parser.txt",
  "LICENSES/marked.txt",
  "LICENSES/string-width.txt",
  "LICENSES/ansi-regex.txt",
  "LICENSES/emoji-regex.txt",
  "LICENSES/get-east-asian-width.txt",
  "LICENSES/strip-ansi.txt",
  "prebuilds/linux-x64-gnu/opentui_markdown_render.node",
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

const manifest = (await Bun.file(path.join(output, "package.json")).json()) as { type?: string; exports?: Record<string, string> }
if (manifest.type !== "module") throw new Error("Release manifest must be an ESM package")
if (manifest.exports?.["./tui"] !== "./tui.js") throw new Error("Release manifest must export the TUI entrypoint")

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

if (importSpecifiers.has("opentui-markdown-render")) throw new Error("The Markdown renderer was not bundled into tui.js")
for (const legacy of ["@resvg/resvg-js", "mathjax-full", "mhchemparser"]) {
  if ([...importSpecifiers].some((specifier) => specifier === legacy || specifier.startsWith(`${legacy}/`))) {
    throw new Error(`Release still imports the legacy rendering dependency: ${legacy}`)
  }
}
for (const specifier of ["@opentui/core", "@opentui/solid", "solid-js"]) {
  if (!importSpecifiers.has(specifier)) {
    throw new Error(`Release must retain a scanner-visible host import: ${specifier}`)
  }
}
if (contents.includes("@opencode/plugin/tui")) throw new Error("Release must not create a second PluginContext")
if (!contents.includes("opentui_markdown_render.node")) throw new Error("Release does not contain the native math loader")
if (!contents.includes("renderer.nativeScene")) throw new Error("Release does not bind syntax resources to the host renderer")
const styledSegment = contents.slice(contents.indexOf("function StyledSegment"), contents.indexOf("function InlineFlow"))
if (!styledSegment.includes("renderable.content = update()") ||
  (!styledSegment.includes("ref: (renderable)") && !styledSegment.includes("_$use((renderable)")) ||
  styledSegment.includes("ref: ref")) {
  throw new Error("Release does not initialize styled text through a bundle-safe callback ref")
}
const gifLoader = contents.slice(contents.indexOf("function loadGif"), contents.indexOf("function drawPatch"))
if (!gifLoader.includes("animation:") || gifLoader.includes("decompressFrames")) {
  throw new Error("Release eagerly decodes animated GIF frames")
}
const localImage = contents.slice(contents.indexOf("function LocalImage"), contents.indexOf("function loadGif"))
if (localImage.includes("jsxDEV") || !localImage.includes("get children()")) {
  throw new Error("Release contains uncompiled dependency JSX that eagerly reads image media")
}
if (!localImage.includes('"alignItems", "center"')) {
  throw new Error("Release does not center standalone images")
}
const documentView = contents.slice(contents.indexOf("function DocumentView"), contents.indexOf("function MarkdownRenderer"))
if (!documentView.includes("function flow(children, columns") || !documentView.includes("return columns();")) {
  throw new Error("Release freezes list layout at the host's provisional width")
}

const archiveContents = new TextDecoder().decode(
  await new Response(Bun.spawn(["tar", "-tzf", archive]).stdout).arrayBuffer(),
)
if (!archiveContents.includes("artifact-canvas/tui.js\n")) throw new Error("Archive does not contain the TUI entrypoint")
if (archiveContents.includes("server.ts") || archiveContents.includes("tui.tsx")) {
  throw new Error("Archive contains development source")
}

process.stdout.write("Release archive is installable on Linux x64 glibc.\n")
