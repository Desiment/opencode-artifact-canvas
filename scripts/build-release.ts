import { cp, mkdir, rm, writeFile } from "node:fs/promises"
import path from "node:path"
import { createSolidTransformPlugin } from "@opentui/solid/bun-plugin"

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

const build = await Bun.build({
  entrypoints: [path.join(root, "tui.tsx")],
  outdir: output,
  naming: { entry: "tui.js" },
  target: "bun",
  format: "esm",
  splitting: false,
  minify: true,
  sourcemap: "none",
  plugins: [createSolidTransformPlugin()],
  // OpenCode supplies these modules to local plugins. Bundling them would create
  // separate Solid and OpenTUI identities, which breaks the host plugin context.
  external: [
    "@opencode/plugin/tui",
    "@opentui/core",
    "@opentui/solid",
    "@opentui/solid/components",
    "@opentui/solid/jsx-runtime",
    "@opentui/solid/jsx-dev-runtime",
    "solid-js",
    "solid-js/store",
    "@resvg/resvg-js",
  ],
})
if (!build.success) throw new AggregateError(build.logs, "Unable to bundle Artifact Canvas")

await writeFile(
  path.join(output, "package.json"),
  JSON.stringify({ name: manifest.name, version: manifest.version, private: true, type: "module" }, null, 2) + "\n",
)

const runtimeFiles = [
  "node_modules/@resvg/resvg-js/index.js",
  "node_modules/@resvg/resvg-js/js-binding.js",
  "node_modules/@resvg/resvg-js/package.json",
  "node_modules/@resvg/resvg-js/LICENSE",
  "node_modules/@resvg/resvg-js-linux-x64-gnu/package.json",
  "node_modules/@resvg/resvg-js-linux-x64-gnu/resvgjs.linux-x64-gnu.node",
]
for (const relative of runtimeFiles) {
  const destination = path.join(output, relative)
  await mkdir(path.dirname(destination), { recursive: true })
  await cp(path.join(root, relative), destination)
}

await cp(path.join(root, "LICENSE"), path.join(output, "LICENSE"))
await mkdir(path.join(output, "LICENSES"), { recursive: true })
for (const [source, destination] of [
  ["node_modules/mathjax-full/LICENSE", "mathjax-full.txt"],
  ["node_modules/diff/LICENSE", "diff.txt"],
    ["node_modules/entities/LICENSE", "entities.txt"],
    ["node_modules/marked/LICENSE.md", "marked.txt"],
    ["node_modules/string-width/license", "string-width.txt"],
] as const) {
  await cp(path.join(root, source), path.join(output, "LICENSES", destination))
}
await writeFile(
  path.join(output, "LICENSES", "NOTICE.md"),
  [
    "# Third-Party Notices",
    "",
    "Artifact Canvas bundles MathJax (Apache-2.0), diff (BSD-3-Clause), entities (BSD-2-Clause), marked (MIT), and string-width (MIT).",
    "The Resvg loader and Linux x64 glibc native binding are included under MPL-2.0; see node_modules/@resvg/resvg-js/LICENSE.",
    "The terminal Mermaid renderer was adapted from OpenCode's MIT-licensed Merman package.",
    "",
  ].join("\n"),
)

await rm(archive, { force: true })
const tar = Bun.spawn(["tar", "-C", distribution, "-czf", archive, "artifact-canvas"], { stdout: "inherit", stderr: "inherit" })
if ((await tar.exited) !== 0) throw new Error("Unable to create release archive")

process.stdout.write(`Created ${archive}\n`)
