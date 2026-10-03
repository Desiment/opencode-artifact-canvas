import { Plugin } from "@opencode/plugin"

// The server entry lets OpenCode discover this package; Canvas itself is a TUI plugin.
export default Plugin.define({
  id: "artifact-canvas",
  setup() {},
})
