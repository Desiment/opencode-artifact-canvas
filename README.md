# Artifact Canvas

Artifact Canvas is an OpenCode V2 TUI plugin for reviewing Markdown artifacts.
It renders TeX formulas and Mermaid diagrams directly in the terminal, supports
block-range review comments, and sends a review packet to the active session.

## Install

Install the Git package through OpenCode. This installs its dependencies into
OpenCode's managed plugin cache and adds the TUI plugin to the global config:

```sh
opencode plugin add github:Desiment/opencode-artifact-canvas
```

Restart OpenCode after installation. Run `/canvas path/to/file.md` from a session
to open the Canvas panel, or run it outside a session for the fullscreen route.

The release targets Linux x64 with glibc. Its native SVG renderer does not work
on musl-based Linux distributions or non-x64 architectures.

## Release

Pushing a version tag such as `v0.1.0` runs the release workflow and publishes
the Linux x64 glibc archive to the matching GitHub Release.

## Development

```sh
bun test
bun run typecheck
bun run build:release
bun run verify:release
```

The plugin requires a current OpenCode V2 TUI with the public plugin API.

## Vendored Mermaid Renderer

`src/merman` is the terminal Mermaid renderer from OpenCode's Merman package,
included here to keep diagrams available without a private OpenCode dependency.
It is distributed under this repository's MIT license.

## Features

- Markdown with native terminal Mermaid rendering.
- Inline and display TeX math rasterized through MathJax.
- Local PNG, JPEG, WebP, and GIF images using standalone Markdown syntax such as `![Chart](./chart.png)`. Images are limited to 24 terminal rows, and transparent pixels are composited against the Canvas surface. Paths are resolved relative to the artifact; network URLs are not fetched.
- Source and rendered views.
- Block-range review comments with visual rails.
- Review feedback that sends the artifact path, source ranges, comments, and a
  unified diff without attaching the complete file to the session.

## License

MIT
