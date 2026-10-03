import path from "node:path"
import { createHash } from "node:crypto"
import { marked, type Tokens } from "marked"

export type MarkdownImage = { href: string; alt: string }
export const imageMaxRows = 24

// Images need a cell box before OpenTUI can draw them. Treat a paragraph made
// entirely of one image as its own Canvas block; mixed inline content remains
// owned by the Markdown renderer.
export function standaloneImage(content: string): MarkdownImage | undefined {
  const tokens = marked.lexer(content)
  if (tokens.length !== 1 || tokens[0]?.type !== "paragraph") return undefined
  const paragraph = tokens[0]
  const inline = paragraph.tokens
  if (!inline || inline.length !== 1 || inline[0]?.type !== "image") return undefined
  const image = inline[0] as Tokens.Image
  return { href: image.href, alt: image.text }
}

export function resolveLocalImage(base: string | undefined, href: string) {
  if (!base) return { error: "The artifact path is unavailable" } as const
  if (!href || href.startsWith("//") || /^[a-z][a-z0-9+.-]*:/i.test(href)) {
    return { error: "Only local image paths are supported" } as const
  }
  try {
    return { path: path.resolve(base, decodeURIComponent(href)) } as const
  } catch {
    return { error: "The image path is invalid" } as const
  }
}

export function imageBox(width: number, height: number, maxColumns: number, cellAspectRatio: number) {
  const columns = Math.max(1, maxColumns)
  const rows = Math.max(1, Math.ceil((columns * height) / (width * cellAspectRatio)))
  if (rows <= imageMaxRows) return { columns, rows }
  const constrainedColumns = Math.max(1, Math.min(columns, Math.floor((imageMaxRows * width * cellAspectRatio) / height)))
  return {
    columns: constrainedColumns,
    rows: Math.min(imageMaxRows, Math.max(1, Math.ceil((constrainedColumns * height) / (width * cellAspectRatio)))),
  }
}

export function localImageID(path: string, box: { columns: number; rows: number }, cell: { width: number; height: number } | null) {
  return `artifact-canvas-image-${createHash("sha256").update(JSON.stringify({ path, box, cell })).digest("hex")}`
}
