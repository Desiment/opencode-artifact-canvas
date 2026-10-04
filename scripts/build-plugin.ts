import path from "node:path"
import { createSolidTransformPlugin } from "@opentui/solid/bun-plugin"

const root = path.resolve(import.meta.dir, "..")

// OpenTUI 0.5.14 runtime plugin prescan (`@opentui/core/runtime-plugin`)
// rewrites these specifiers to the host module instances. It detects them with
// regexes that require whitespace after `from`/`import`, while Bun minification
// emits `from"@opentui/core"`. A minified entrypoint is therefore invisible to
// the host, Bun resolves the plugin-local copies, and the plugin ends up with a
// second set of class identities (`BaseRenderable`, `RendererContext`).
// `minify: false` keeps the entrypoint scanner-readable.
const HOST_RUNTIME_SPECIFIERS = ["@opentui/core", "@opentui/solid", "solid-js"]

const SCANNER_PATTERNS = [
  /(from\s+["'])([^"']+)(["'])/g,
  /(import\s+["'])([^"']+)(["'])/g,
  /(import\s*\(\s*["'])([^"']+)(["']\s*\))/g,
  /(require\s*\(\s*["'])([^"']+)(["']\s*\))/g,
]

function assertHostSpecifiersAreScannable(contents: string) {
  const detected = new Set<string>()
  for (const pattern of SCANNER_PATTERNS) {
    for (const match of contents.matchAll(pattern)) detected.add(match[2]!)
  }
  for (const specifier of HOST_RUNTIME_SPECIFIERS) {
    if (contents.includes(specifier) && !detected.has(specifier)) {
      throw new Error(
        `tui.js references ${specifier} but it is invisible to the OpenTUI runtime plugin prescan; ` +
          `the host cannot rewrite it and the plugin would load its own copy of OpenTUI`,
      )
    }
  }
}

export async function buildPlugin() {
  const build = await Bun.build({
    entrypoints: [path.join(root, "tui.tsx")],
    outdir: root,
    naming: { entry: "tui.js" },
    target: "bun",
    format: "esm",
    minify: false,
    sourcemap: "none",
    plugins: [createSolidTransformPlugin()],
    // These must resolve to the host's runtime instances. All other runtime
    // dependencies are bundled so a managed Git package has one entrypoint.
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
  assertHostSpecifiersAreScannable(await Bun.file(path.join(root, "tui.js")).text())
}

if (import.meta.main) await buildPlugin()
