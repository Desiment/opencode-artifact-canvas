import path from "node:path"
import { createSolidTransformPlugin } from "@opentui/solid/bun-plugin"

const root = path.resolve(import.meta.dir, "..")

export async function buildPlugin() {
  const build = await Bun.build({
    entrypoints: [path.join(root, "tui.tsx")],
    outdir: root,
    naming: { entry: "tui.js" },
    target: "bun",
    format: "esm",
    minify: true,
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
}

if (import.meta.main) await buildPlugin()
