import type { RGBA } from "@opentui/core"
import { createHash } from "node:crypto"

// Terminal cell size in pixels, when the terminal reports one. `null` means it
// did not answer the pixel size query, so the raster falls back to a fixed height.
export type CellSize = { width: number; height: number }

export type MathImage = {
  bytes: Uint8Array
  svg: string
  width: number
  height: number
  // Cell box at scale 1, derived from the formula's own ex metrics.
  rows: number
  columns: number
  // Rows from the top of the cell box down to the formula baseline, so text on
  // the same line can be dropped onto it.
  baseline: number
  emWidth: number
  emHeight: number
}

const mathCache = new Map<string, Promise<MathImage>>()

export function renderMath(content: string, display: boolean, color: string, background: string, cell: CellSize | null, scale = 1, compact = false) {
  const key = hashMath(content, display, color, background, cell, scale, compact)
  const cached = mathCache.get(key)
  if (cached) return cached
  const result = renderMathUncached(content, display, color, background, cell, scale, compact)
  mathCache.set(key, result)
  return result
}

export function hashMath(content: string, display: boolean, color: string, background: string, cell: CellSize | null, scale = 1, compact = false) {
  return createHash("sha256")
    .update(JSON.stringify({ content, display, color, background, cell, scale, compact, renderer: "mathjax-svg-resvg-png-v6" }))
    .digest("hex")
}

// Keep the terminal placement stable while its opaque raster is regenerated for
// a changed review surface. Kitty otherwise leaves the former image behind.
export function mathImageID(content: string, display: boolean, color: string, cell: CellSize | null, scale = 1, compact = false) {
  return createHash("sha256")
    .update(JSON.stringify({ content, display, color, cell, scale, compact, renderer: "mathjax-svg-resvg-png-v6" }))
    .digest("hex")
}

export function rgbaToHex(color: RGBA) {
  const channel = (value: number) => Math.round(Math.max(0, Math.min(1, value)) * 255)
    .toString(16)
    .padStart(2, "0")
  return `#${channel(color.r)}${channel(color.g)}${channel(color.b)}`
}

async function renderMathUncached(
  content: string,
  display: boolean,
  color: string,
  background: string,
  cell: CellSize | null,
  scale: number,
  compact: boolean,
): Promise<MathImage> {
  const mathjaxModule = await import("mathjax-full/js/mathjax.js")
  const texModule = await import("mathjax-full/js/input/tex.js")
  const svgModule = await import("mathjax-full/js/output/svg.js")
  const adaptorModule = await import("mathjax-full/js/adaptors/liteAdaptor.js")
  const htmlModule = await import("mathjax-full/js/handlers/html.js")
  const packageModule = await import("mathjax-full/js/input/tex/AllPackages.js")
  const resvgModule = await import("@resvg/resvg-js")

  const adaptor = adaptorModule.liteAdaptor()
  htmlModule.RegisterHTMLHandler(adaptor)
  const document = mathjaxModule.mathjax.document("", {
    InputJax: new texModule.TeX({ packages: packageModule.AllPackages }),
    OutputJax: new svgModule.SVG({ fontCache: "none" }),
  })
  const output = adaptor.outerHTML(document.convert(content, { display }))
  if (output.includes("data-mml-node=\"merror\"") || output.includes("mjx-merror")) {
    throw new Error("MathJax returned an error node")
  }
  const match = output.match(/<svg[\s\S]*<\/svg>/)
  if (!match) throw new Error("MathJax did not produce SVG")
  const geometry = normalizeSvg(match[0], display, color, cell, scale, compact)
  // Opaque on purpose: kitty composites the RGBA image itself and interpolates
  // the black RGB of fully transparent pixels, which shows up as a visible
  // bounding-box rectangle. Rasterizing on the surface color makes every image
  // protocol composite identically.
  const renderer = new resvgModule.Resvg(geometry.svg, { background })
  const image = renderer.render()
  return {
    bytes: image.asPng(),
    svg: geometry.svg,
    width: image.width,
    height: image.height,
    rows: geometry.rows,
    columns: geometry.columns,
    baseline: geometry.baseline,
    emWidth: geometry.emWidth,
    emHeight: geometry.emHeight,
  }
}

// A terminal cell is about twice as tall as it is wide, so one em of math is two
// columns wide and one cell tall. OpenTUI preserves an image's physical aspect
// ratio when it maps a raster onto a cell box, so the padded raster carries the
// cell box's own aspect ratio: then `fit` fills the box exactly instead of
// letterboxing it, and the baseline stays put when display scale changes.
const fallbackCellAspectRatio = 2

// Raster height for a terminal that reports no cell pixel size. It stays fixed and
// independent of how many cells the box spans, so a backend that sizes by raster
// pixels cannot inflate the formula past the box it belongs to.
const rasterHeight = (display: boolean) => (display ? 288 : 144)

// Rows of empty space above the ink. A formula taller than the text baseline it
// shares would otherwise start exactly at the top edge of its own cell box, where
// rasterization clips the anti-aliased edge of the tallest glyph.
const bleed = 0.08
const inlineGlyphScale = 1.02

// MathJax reports the viewBox in 1/1000 em with the baseline at y = 0, so the ink
// box is tight and the baseline offset is known exactly. That is what lets the
// raster be padded so a formula lands on the same baseline as the text around it.
function normalizeSvg(svg: string, display: boolean, color: string, cell: CellSize | null, scale: number, compact: boolean) {
  const box = svg.match(/viewBox="([^"]+)"/)?.[1]?.split(/\s+/).map(Number)
  const minX = box?.[0]
  const minY = box?.[1]
  const viewWidth = box?.[2]
  const viewHeight = box?.[3]
  if (
    minX === undefined ||
    minY === undefined ||
    !viewWidth ||
    !viewHeight ||
    !Number.isFinite(minX) ||
    !Number.isFinite(minY) ||
    !Number.isFinite(viewWidth) ||
    !Number.isFinite(viewHeight)
  ) {
    throw new Error("MathJax SVG is missing a usable viewBox")
  }
  const emWidth = viewWidth / 1000
  const emHeight = viewHeight / 1000
  const inkAbove = -minY / 1000
  const inkBelow = (minY + viewHeight) / 1000
  const cellAspectRatio = cell ? cell.height / cell.width : fallbackCellAspectRatio

  // Inline math is sized like the text around it, so it pads itself up to the
  // baseline the text sits on. Display math owns a centered block but starts at
  // that same text size before its independent scale is applied.
  // Display math has the same text scale as inline math by default. Its selected
  // scale is measured again here rather than enlarging a finished image, so a
  // small `+`/`-` step changes the box and the raster together.
  // A terminal text cell already has room for ordinary descenders. MathJax's
  // near-text-height boxes can exceed that cell by only a few pixels, which
  // would otherwise round `y` or `y^2` up to a second inline row. Fit those
  // formulas into the text row; genuinely tall inline math still keeps its
  // measured multi-row box.
  const textColumns = 2
  const inlineColumns =
    emHeight <= 1.1
      ? Math.min(textColumns, ((1 - bleed - 0.01) * cellAspectRatio) / (Math.max(0.75, inkAbove) + inkBelow))
      : textColumns
  const emColumns = display ? textColumns * scale : inlineColumns
  const textBaseline = 0.75
  const inkAboveRows = inkAbove * (emColumns / cellAspectRatio)
  const inkBelowRows = inkBelow * (emColumns / cellAspectRatio)
  const padding = compact && !display ? 0.04 : bleed
  // A compact variant is only used where its normal raster would cover later
  // content. Keep its normal width reservation, but scale the glyph paths into
  // the one-row text band around the shared baseline.
  const glyphScale = compact && !display
    ? Math.min(inlineGlyphScale, (textBaseline - padding) / inkAboveRows, (1 - textBaseline - padding) / inkBelowRows)
    : inlineGlyphScale
  const baseline = compact && !display
    ? textBaseline
    : (display ? inkAbove : Math.max(textBaseline, inkAbove)) * (emColumns / cellAspectRatio)
  // The bleed is charged to the box rather than taken out of the descender room,
  // so padding the top can never clip the bottom of the ink.
  const inkBottom = baseline + inkBelowRows * glyphScale
  const rows = compact && !display ? 1 : Math.max(display ? 3 : 1, Math.ceil(inkBottom + padding))
  const columns = Math.max(1, Math.ceil(emWidth * emColumns * (compact && !display ? glyphScale : 1)))

  // Padding the viewBox to the cell box gives the raster and the cell box one
  // aspect ratio, so `fit` never letterboxes and the baseline stays put when the
  // formula is scaled. MathJax puts the baseline at y = 0 with y growing
  // downward, so the padded top edge is that many cells above the baseline.
  //
  // The pad has to be measured in MathJax's own units, which are 1/1000 em: the
  // glyph paths are never rescaled, so a viewBox in any other unit silently
  // rasterizes a window of the formula instead of the formula.
  const unitsPerColumn = 1000 / emColumns
  const unitsPerRow = (1000 * cellAspectRatio) / emColumns
  const boxWidth = columns * unitsPerColumn
  const boxHeight = rows * unitsPerRow
  const drawnWidth = compact && !display ? viewWidth * glyphScale : viewWidth
  const drawnLeft = compact && !display ? minX + (viewWidth - drawnWidth) / 2 : minX
  const left = drawnLeft - (boxWidth - drawnWidth) / 2
  // The bleed goes above the ink, never between the baseline and the ink, so the
  // formula keeps sharing the text baseline while the box grows downwards.
  const top = -(baseline + padding) * unitsPerRow

  // Raster pixels are a separate concern from the units above, and both sizes
  // below keep `width / height === columns / (rows * cellAspectRatio)`, which is
  // the invariant that makes `fit` exact: OpenTUI compares
  // `width / height * cellAspectRatio` against `columns / rows`. Kitty draws a
  // raster at true pixel size, so a terminal that reports its cell size gets one
  // generated at exactly that size, and one that does not gets a fixed height
  // rather than a raster measured in cells.
  const height = cell ? Math.round(rows * cell.height) : Math.max(1, Math.round(rasterHeight(display) * (display ? scale : 1)))
  const width = cell ? Math.round(columns * cell.width) : Math.round((height * columns) / (rows * cellAspectRatio))
  const source = display
    ? svg
    : svg.replace(
        /<g data-mml-node="math">/,
        `<g data-mml-node="math" transform="matrix(${glyphScale} 0 0 ${glyphScale} ${(minX + viewWidth / 2) * (1 - glyphScale)} 0)">`,
      )
  return {
    svg: source
      .replace(/<svg\b/, `<svg color="${color}" preserveAspectRatio="xMidYMid meet"`)
      .replace(/\sviewBox="[^"]*"/, ` viewBox="${left} ${top} ${boxWidth} ${boxHeight}"`)
      .replace(/\swidth="[^"]*"/, ` width="${width}"`)
      .replace(/\sheight="[^"]*"/, ` height="${height}"`),
    rows,
    columns,
    baseline: baseline + padding,
    emWidth,
    emHeight,
  }
}
