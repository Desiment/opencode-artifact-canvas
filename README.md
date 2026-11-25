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

OpenCode reloads plugin configuration automatically; use `/reload` if you want
to force an immediate reload. Run `/canvas path/to/file.md` from a session
to open the Canvas panel, or run it outside a session for the fullscreen route.
Run `/canvas` without a path to pick an artifact from the project.

The release targets Linux x64 with glibc. Its native math renderer does not work
on musl-based Linux distributions or non-x64 architectures.

## Configuration

An empty `/canvas` opens a searchable picker over the project's artifacts, and
`o` inside Canvas reopens it to switch artifacts. The picker scans the OpenCode
project directory: hidden files are included, while hidden directories,
`node_modules`, and symlinked directories (which are not followed) are skipped.
Searchable pickers require OpenCode TUI 2.2.5 or newer.

Only `.md` files are listed by default. Add other extensions through the plugin
options:

```jsonc
{ "plugins": [{ "package": "opencode-artifact-canvas", "options": { "extensions": [".md", ".mdx"] } }] }
```

`extensions` accepts an array of extensions or a single comma-separated string.

## Release

Pushing a version tag such as `v0.2.0` runs the release workflow and publishes
the Linux x64 glibc archive to the matching GitHub Release.

## Development

```sh
bun test
bun run typecheck
bun run build:release
bun run verify:release
```

The plugin requires a current OpenCode V2 TUI with the public plugin API.

## Renderer

Canvas uses [`opentui-markdown-render`](https://github.com/Desiment/opentui-markdown-render)
for Markdown parsing, source ranges, TeX, Mermaid, tables, and local images.
Review annotations are attached through the renderer's public `renderUnit` and `unitSurface` APIs;
the plugin does not maintain a fork of the rendering stack.

## Features

- Markdown with native terminal Mermaid rendering.
- Searchable artifact picker for an empty `/canvas`, and `o` to browse or switch
  artifacts without leaving Canvas.
- Inline and display TeX math rendered in-process by `opentui-markdown-render`.
- Local PNG, JPEG, WebP, and GIF images using standalone Markdown syntax such as `![Chart](./chart.png)`. Images are limited to 24 terminal rows, and transparent pixels are composited against the Canvas surface. Paths are resolved relative to the artifact; network URLs are not fetched.
- Source and rendered views.
- Block-range review comments with visual rails.
- Review feedback that sends the artifact path, source ranges, comments, and a
  unified diff without attaching the complete file to the session.

## License

MIT
