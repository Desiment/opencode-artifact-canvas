import { cp, mkdir, rm, writeFile } from "node:fs/promises"
import path from "node:path"
import { buildPlugin } from "./build-plugin"

const target = "linux-x64-glibc"
const root = path.resolve(import.meta.dir, "..")
const distribution = path.join(root, "dist")
const output = path.join(distribution, "artifact-canvas")
const archive = path.join(distribution, `artifact-canvas-${target}.tar.gz`)

if (process.platform !== "linux" || process.arch !== "x64") {
  throw new Error(`The ${target} release must be built on Linux x64; found ${process.platform} ${process.arch}`)
}

const manifest = (await Bun.file(path.join(root, "package.json")).json()) as { name: string; version: string }
await rm(output, { recursive: true, force: true })
await mkdir(output, { recursive: true })

await buildPlugin()
await cp(path.join(root, "tui.js"), path.join(output, "tui.js"))

await writeFile(
  path.join(output, "package.json"),
  JSON.stringify({
    name: manifest.name,
    version: manifest.version,
    private: true,
    type: "module",
    exports: { "./tui": "./tui.js" },
  }, null, 2) + "\n",
)

const nativeMath = "prebuilds/linux-x64-gnu/opentui_markdown_render.node"
await mkdir(path.dirname(path.join(output, nativeMath)), { recursive: true })
await cp(path.join(root, "node_modules/opentui-markdown-render", nativeMath), path.join(output, nativeMath))

await cp(path.join(root, "LICENSE"), path.join(output, "LICENSE"))
await mkdir(path.join(output, "LICENSES"), { recursive: true })
for (const [source, destination] of [
  ["node_modules/diff/LICENSE", "diff.txt"],
  ["node_modules/opentui-markdown-render/LICENSE", "opentui-markdown-render.txt"],
  ["node_modules/opentui-markdown-render/NOTICE", "opentui-markdown-render-NOTICE.txt"],
  ["node_modules/@dagrejs/dagre/LICENSE", "dagre.txt"],
  ["node_modules/@dagrejs/graphlib/LICENSE", "graphlib.txt"],
  ["node_modules/entities/LICENSE", "entities.txt"],
  ["node_modules/gifuct-js/LICENSE", "gifuct-js.txt"],
  ["node_modules/js-binary-schema-parser/LICENSE", "js-binary-schema-parser.txt"],
  ["node_modules/marked/LICENSE.md", "marked.txt"],
  ["node_modules/string-width/license", "string-width.txt"],
  ["node_modules/ansi-regex/license", "ansi-regex.txt"],
  ["node_modules/emoji-regex/LICENSE-MIT.txt", "emoji-regex.txt"],
  ["node_modules/get-east-asian-width/license", "get-east-asian-width.txt"],
  ["node_modules/strip-ansi/license", "strip-ansi.txt"],
] as const) {
  await cp(path.join(root, source), path.join(output, "LICENSES", destination))
}
await writeFile(
  path.join(output, "LICENSES", "NOTICE.md"),
  [
    "# Third-Party Notices",
    "",
    "Artifact Canvas bundles diff (BSD-3-Clause) and opentui-markdown-render (MIT), including the renderer's JavaScript dependencies.",
    "Their license texts are included in this directory: Dagre, Graphlib, gifuct-js, js-binary-schema-parser, marked, string-width, ansi-regex, emoji-regex, get-east-asian-width, and strip-ansi are MIT; entities is BSD-2-Clause.",
    "The Markdown renderer includes its Linux x64 glibc native math prebuild; see opentui-markdown-render-NOTICE.txt.",
    "",
  ].join("\n"),
)

await rm(archive, { force: true })
const tar = Bun.spawn(["tar", "-C", distribution, "-czf", archive, "artifact-canvas"], { stdout: "inherit", stderr: "inherit" })
if ((await tar.exited) !== 0) throw new Error("Unable to create release archive")

process.stdout.write(`Created ${archive}\n`)
