import { createMermaidCodeBlockRenderer } from "./merman/markdown"
import { resolveOpenCodeDiagramPalette } from "./merman/palette"
import type { Plugin } from "@opencode/plugin/tui"
import { generateSyntax } from "@opencode/theme/tui"
import { createMarkdownCodeBlockRenderer, imageInfo, NativeImage, TextAttributes, type MarkdownOptions, type RGBA } from "@opentui/core"
import { RendererContext } from "@opentui/solid"
import { spawn } from "node:child_process"
import path from "node:path"
import { createEffect, createMemo, createResource, createSignal, For, Match, onCleanup, Show, Switch } from "solid-js"
import { CanvasFlow, scanDocument, type CanvasBlock } from "./inline"
import { mathImageID, renderMath, rgbaToHex, type CellSize, type MathImage } from "./math"
import { mosaicScale, type CanvasGraphics, useCanvasGraphics } from "./graphics"
import { imageBox, localImageID, resolveLocalImage } from "./images"
import {
  addReviewComment,
  assignCommentRails,
  buildGeneralMessageDraft,
  deleteReviewComment,
  startReview,
  updateReviewComment,
  type ReviewCommentRail,
  type ReviewSnapshot,
} from "./review"

type CanvasMode = "rendered" | "source"
type CanvasPhase = "edit" | "review"
type CanvasContent = { value?: string; error?: string }

type CanvasReviewColors = {
  readonly cursor: RGBA
  readonly selection: RGBA
  readonly comment: RGBA
  readonly commentBackground: RGBA
}

function canvasReviewColors(theme: Plugin.Context["theme"]): CanvasReviewColors {
  const canvas = theme as typeof theme & { readonly canvas?: { readonly review: CanvasReviewColors } }
  return canvas.canvas?.review ?? {
    cursor: theme.text.base,
    selection: theme.background.raised.base,
    comment: theme.text.feedback.warning.base,
    commentBackground: theme.background.raised.base,
  }
}

function CanvasPage(props: {
  context: Plugin.Context
  renderNode: MarkdownOptions["renderNode"]
  file: () => string | undefined
  onClose: () => void
  active?: () => boolean
  presentation: string
  sessionID?: () => string | undefined
  mathSize: () => number
  onMathSize: (delta: number) => void
}) {
  const theme = props.context.theme
  const cwd = process.cwd()
  const graphics = useCanvasGraphics(props.context.renderer)
  const [mode, setMode] = createSignal<CanvasMode>("rendered")
  const [phase, setPhase] = createSignal<CanvasPhase>("edit")
  const [baseline, setBaseline] = createSignal<string>()
  const [review, setReview] = createSignal<ReviewSnapshot>()
  const [cursor, setCursor] = createSignal(0)
  const [visualStart, setVisualStart] = createSignal<number>()
  const [width, setWidth] = createSignal(0)
  const surface = () => rgbaToHex(theme.background.base)
  const [content, { refetch }] = createResource(props.file, async (file): Promise<CanvasContent | undefined> => {
    if (!file) return undefined
    const artifact = Bun.file(file)
    if (!(await artifact.exists())) return { error: `Artifact does not exist: ${file}` }
    try {
      return { value: await artifact.text() }
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) }
    }
  })
  const blocks = createMemo(() => scanDocument(content()?.value ?? ""))
  let baselineFile: string | undefined

  createEffect(() => {
    const file = props.file()
    const value = content()?.value
    if (!file || value === undefined || baselineFile === file) return
    baselineFile = file
    setBaseline(value)
    setPhase("edit")
    setReview()
    setCursor(0)
    setVisualStart()
  })

  const selectedRange = () => {
    const items = blocks()
    const start = visualStart()
    if (start === undefined || !items.length) return undefined
    const from = Math.min(start, cursor())
    const to = Math.max(start, cursor())
    const first = items[from]!
    const last = items[to]!
    return {
      start: first.source.start,
      end: last.source.end,
      atomKind: from === to ? first.source.atom : "text",
    } as const
  }

  const moveCursor = (delta: number) => {
    setCursor((value) => Math.max(0, Math.min(Math.max(0, blocks().length - 1), value + delta)))
  }

  const enterReview = () => {
    const value = content()?.value
    if (value === undefined) return
    setReview(startReview(baseline() ?? value, value))
    setPhase("review")
    setMode("rendered")
    setCursor(0)
    setVisualStart()
  }

  const leaveReview = () => {
    setPhase("edit")
    setReview()
    setVisualStart()
  }
  const showHelp = () =>
    props.context.ui.dialog.alert({
      title: "Artifact Canvas",
      message: phase() === "review"
        ? [
            "r  finish review",
            "j/k or arrows  move between blocks",
            "v  start a visual block selection",
            "c  comment selection",
            "d  delete comment on selection",
            "shift+s  compose and send review feedback",
            "q  close canvas",
            "Esc  cancel selection or close canvas",
          ].join("\n")
        : [
            "r  start review",
            "s  toggle rendered/source",
            "e  edit artifact",
            "+/-  resize display math",
            "q or Esc  close canvas",
          ].join("\n"),
    })

  const addComment = async () => {
    const range = selectedRange()
    if (!range) {
      props.context.ui.toast.show({ variant: "warning", message: "Start a visual selection before adding a comment" })
      return
    }
    const message = await props.context.ui.dialog.prompt({ title: "Review comment", placeholder: "What should change?" })
    if (!message?.trim() || !review()) return
    setReview((value) =>
      value
        ? addReviewComment(value, { id: crypto.randomUUID(), range, message: message.trim() })
        : value,
    )
    setVisualStart()
  }

  const sendReview = async () => {
    const current = review()
    const sessionID = props.sessionID?.()
    const file = props.file()
    if (!current) return
    if (!sessionID) {
      props.context.ui.toast.show({ variant: "warning", message: "Open Canvas from a session to send review feedback" })
      return
    }
    const general = await props.context.ui.dialog.prompt({
      title: "Send review feedback",
      placeholder: "Give the model an overall instruction",
      value: "Please address these review notes.",
    })
    if (general === undefined) return
    const text = buildGeneralMessageDraft(current, general, file ?? "artifact.md")
    await props.context.client.session
      .prompt({
        sessionID,
        text,
        delivery: "steer",
      })
      .then(() => props.context.ui.toast.show({ variant: "success", message: "Review feedback sent" }))
      .catch((error: unknown) => props.context.ui.toast.show({ variant: "error", message: String(error) }))
  }

  const editComment = async (id: string) => {
    const current = review()
    const comment = current?.comments.find((item) => item.id === id)
    if (!current || !comment) return
    const message = await props.context.ui.dialog.prompt({
      title: "Edit review comment",
      value: comment.message,
      placeholder: "What should change?",
    })
    if (message === undefined) return
    setReview(updateReviewComment(current, id, { message: message.trim() }))
  }

  props.context.keymap.layer(() => ({
    enabled: () => props.active?.() ?? true,
    commands: [
      {
        bind: "escape",
        title: "back",
        run: () => {
          if (visualStart() !== undefined) {
            setVisualStart()
            return
          }
          props.onClose()
        },
      },
      { bind: "s", title: mode() === "source" ? "rendered" : "source", run: () => setMode(toggleMode(mode())) },
      {
        bind: "e",
        title: "edit artifact",
        run: () => {
          if (phase() === "review") {
            props.context.ui.toast.show({ variant: "warning", message: "Leave review mode before editing the artifact" })
            return
          }
          void editArtifact(props.context, props.file(), cwd, refetch)
        },
      },
      {
        bind: "r",
        title: phase() === "review" ? "leave review" : "start review",
        run: () => (phase() === "review" ? leaveReview() : enterReview()),
      },
      { bind: "q", title: "close canvas", run: props.onClose },
      { bind: "h", title: "canvas help", run: () => void showHelp() },
      { bind: "j", title: "next block", enabled: () => phase() === "review", run: () => moveCursor(1) },
      { bind: "down", title: "next block", enabled: () => phase() === "review", run: () => moveCursor(1) },
      { bind: "k", title: "previous block", enabled: () => phase() === "review", run: () => moveCursor(-1) },
      { bind: "up", title: "previous block", enabled: () => phase() === "review", run: () => moveCursor(-1) },
      { bind: "v", title: "visual select", enabled: () => phase() === "review", run: () => setVisualStart((value) => value ?? cursor()) },
      { bind: "c", title: "comment selection", enabled: () => phase() === "review", run: () => void addComment() },
      {
        bind: "d",
        title: "delete selected comment",
        enabled: () => phase() === "review",
        run: () => {
          const range = selectedRange()
          const current = review()
          if (!range || !current) return
          const comment = current.comments.find((item) => item.range.start === range.start && item.range.end === range.end)
          if (comment) setReview(deleteReviewComment(current, comment.id))
        },
      },
      {
        bind: "shift+s",
        title: "compose review feedback",
        enabled: () => phase() === "review",
        run: () => void sendReview(),
      },
      { bind: "+", title: "bigger display math", run: () => props.onMathSize(1) },
      { bind: "=", title: "bigger display math", run: () => props.onMathSize(1) },
      { bind: "-", title: "smaller display math", run: () => props.onMathSize(-1) },
      { bind: "_", title: "smaller display math", run: () => props.onMathSize(-1) },
    ],
  }))

  const label = createMemo(() => {
    const file = props.file()
    if (!file) return "No artifact selected"
    return path.relative(cwd, file) || file
  })
  const header = createMemo(() => {
    const columns = width()
    if (columns < 50) return { image: "", status: `${props.mathSize().toFixed(1)}x` }
      if (columns < 78) return { image: `img:${graphics.protocol()}`, status: `${props.mathSize().toFixed(1)}x +/- r s e q` }
    if (columns < 120) {
      return {
        image: `img:${graphics.protocol()}`,
          status: `${props.presentation} ${columns}c ${mode()} ${phase()} ${props.mathSize().toFixed(1)}x h r s e q`,
      }
    }
    return {
      image: `img:${graphics.protocol()} ${graphics.cell() ? `px:${graphics.cell()!.width}x${graphics.cell()!.height}` : "px:?"}`,
      status: `${props.presentation} ${columns}c ${mode()} ${phase()} display ${props.mathSize().toFixed(1)}x h help - r review - s source - e edit - q close`,
    }
  })

  return (
    <box
      width="100%"
      height="100%"
      backgroundColor={theme.background.base}
      flexDirection="column"
      // Docked beside the chat the canvas needs its own edge; fullscreen already has the terminal border.
      border={props.presentation === "panel" ? ["left"] : false}
      borderColor={theme.border.base}
      onSizeChange={function () {
        setWidth(this.width)
      }}
    >
      <box
        flexShrink={0}
        flexDirection="row"
        gap={1}
        paddingLeft={1}
        paddingRight={1}
        border={["bottom"]}
        borderColor={theme.decrease(theme.background.base)}
      >
        <text fg={theme.text.base} attributes={TextAttributes.BOLD} flexShrink={0}>
          canvas
        </text>
        <Show when={header().image}>
          <text fg={theme.text.muted} flexShrink={0}>
            {header().image}
          </text>
        </Show>
        <text fg={theme.text.muted} flexGrow={1} minWidth={0} wrapMode="none" truncate>
          {label()}
        </text>
        <text fg={theme.text.muted} flexShrink={0}>
          {header().status}
        </text>
      </box>
      <scrollbox
        flexGrow={1}
        contentOptions={{ minHeight: "100%", paddingLeft: 2, paddingRight: 2, paddingTop: 1, paddingBottom: 1 }}
      >
        <Switch>
          <Match when={!props.file()}>
            <box flexDirection="column" gap={1}>
              <text fg={theme.text.base} attributes={TextAttributes.BOLD}>
                Open a Markdown artifact with /canvas path/to/file.md
              </text>
              <text fg={theme.text.muted}>Rendered mode supports $...$, $$...$$, \\(...\\), and \\[...\\].</text>
            </box>
          </Match>
          <Match when={content()?.error}>
            <box flexDirection="column" gap={1}>
              <text fg={theme.text.feedback.error.base}>Could not load artifact</text>
              <text fg={theme.text.muted}>{content()!.error}</text>
            </box>
          </Match>
          <Match when={content.loading}>
            <text fg={theme.text.muted}>Loading artifact...</text>
          </Match>
          <Match when={content()?.value}>
            {(value) => (
              <CanvasDocument
                content={value()}
                theme={theme}
                blocks={blocks}
                mode={mode}
                phase={phase}
                cursor={cursor}
                visualStart={visualStart}
                review={review}
                onDeleteComment={(id) => setReview((value) => (value ? deleteReviewComment(value, id) : value))}
                onEditComment={editComment}
                renderNode={props.renderNode}
                mathSize={props.mathSize}
                width={width}
                surface={surface}
                graphics={graphics}
                imageBase={() => {
                  const file = props.file()
                  return file ? path.dirname(file) : undefined
                }}
              />
            )}
          </Match>
        </Switch>
      </scrollbox>
    </box>
  )
}

function CanvasDocument(props: {
  content: string
  theme: Plugin.Context["theme"]
  blocks: () => CanvasBlock[]
  mode: () => CanvasMode
  phase: () => CanvasPhase
  cursor: () => number
  visualStart: () => number | undefined
  review: () => ReviewSnapshot | undefined
  onDeleteComment: (id: string) => void
  onEditComment: (id: string) => void
  renderNode: MarkdownOptions["renderNode"]
  mathSize: () => number
  width: () => number
  surface: () => string
  graphics: CanvasGraphics
  imageBase: () => string | undefined
}) {
  const theme = props.theme
  const reviewColors = () => canvasReviewColors(theme)
  const rails = createMemo(() => assignCommentRails(props.review()?.comments ?? [], props.blocks().map((block) => block.source)))
  const railCount = createMemo(() => Math.max(0, ...rails().map((rail) => rail.column + 1)))
  const available = createMemo(() => Math.max(8, props.width() - 4 - railCount()))

  return (
    <Show
      when={props.mode() === "rendered"}
      fallback={
        <text fg={theme.text.base} wrapMode="word">
          {props.content}
        </text>
      }
    >
      <box width="100%" flexDirection="column">
        <For each={props.blocks()}>
          {(block, index) => {
            const activeRails = () => rails().filter((rail) => rail.start <= index() && rail.end >= index())
            const startingComments = () => rails().filter((rail) => rail.start === index()).map((rail) => rail.comment)
            const endingRails = () => rails().filter((rail) => rail.end === index())
            const continuingRails = () => rails().filter((rail) => rail.start <= index() && rail.end > index())
            const selected = (blockIndex: number) => {
              const start = props.visualStart()
              return start !== undefined && props.phase() === "review" && blockIndex >= Math.min(start, props.cursor()) && blockIndex <= Math.max(start, props.cursor())
            }
            return (
              <>
                <box width="100%" flexDirection="row">
                  <box flexGrow={1} minWidth={0}>
                    <CanvasBlockView
                      block={block}
                      theme={theme}
                      renderNode={props.renderNode}
                      mathSize={props.mathSize}
                      available={available}
                       surface={props.surface}
                       graphics={props.graphics}
                       imageBase={props.imageBase}
                      selected={() => selected(index())}
                      active={() => props.phase() === "review" && index() === props.cursor()}
                      commented={() => activeRails().length > 0}
                      startingComments={startingComments}
                      commentNumber={(comment) => (props.review()?.comments.indexOf(comment) ?? -1) + 1}
                    />
                  </box>
                  <CanvasCommentRails theme={theme} columns={railCount} rails={activeRails} />
                </box>
                <For each={endingRails()}>
                  {(rail) => (
                    <box width="100%" flexDirection="row">
                      <box flexGrow={1} minWidth={0}>
                        <CanvasCommentCard
                          theme={theme}
                          comment={rail.comment}
                          number={props.review()?.comments.indexOf(rail.comment) ?? -1}
                          onDelete={props.onDeleteComment}
                          onEdit={props.onEditComment}
                        />
                      </box>
                      <CanvasCommentRails theme={theme} columns={railCount} rails={() => [...continuingRails(), rail]} connector={() => rail.column} />
                    </box>
                  )}
                </For>
                <Show when={index() < props.blocks().length - 1}>
                  <box
                    width="100%"
                    height={1}
                    flexDirection="row"
                  >
                    <box
                      flexGrow={1}
                      minWidth={0}
                      backgroundColor={selected(index()) && selected(index() + 1) ? reviewColors().selection : continuingRails().length > 0 ? reviewColors().commentBackground : undefined}
                    />
                    <CanvasCommentRails theme={theme} columns={railCount} rails={continuingRails} />
                  </box>
                </Show>
              </>
            )
          }}
        </For>
      </box>
    </Show>
  )
}

// A block owns either the Markdown renderer or the inline flow, never both.
function CanvasBlockView(props: {
  block: CanvasBlock
  theme: Plugin.Context["theme"]
  renderNode: MarkdownOptions["renderNode"]
  mathSize: () => number
  available: () => number
  surface: () => string
  graphics: CanvasGraphics
  imageBase: () => string | undefined
  selected: () => boolean
  active: () => boolean
  commented: () => boolean
  startingComments: () => readonly ReviewSnapshot["comments"][number][]
  commentNumber: (comment: ReviewSnapshot["comments"][number]) => number
}) {
  const theme = props.theme
  const reviewColors = () => canvasReviewColors(theme)
  const background = () => props.selected()
    ? reviewColors().selection
    : props.commented()
      ? reviewColors().commentBackground
      : undefined
  const surface = () => background() ? rgbaToHex(background()!) : props.surface()
  const view = createMemo(() => {
    const block = props.block
    if (block.type === "markdown") {
      if (!block.content.trim()) return undefined
      return (
        <markdown
          syntaxStyle={generateSyntax(theme)}
          renderNode={props.renderNode}
          content={block.content}
          internalBlockMode="top-level"
          tableOptions={{ style: "grid", cellPaddingX: 1 }}
          conceal
          fg={theme.markdown.text}
          bg={background() ?? theme.background.base}
        />
      )
    }
    if (block.type === "display-math") {
      return (
        <MathBlock
          content={block.content}
          open={block.open}
          close={block.close}
          size={props.mathSize}
          maxWidth={props.available}
          surface={surface}
          theme={theme}
          graphics={props.graphics}
        />
      )
    }
    if (block.type === "image") {
      return <LocalImage href={block.href} alt={block.alt} base={props.imageBase} maxWidth={props.available} background={theme.background.base} theme={theme} graphics={props.graphics} />
    }
    return <CanvasFlow block={block.block} columns={props.available} surface={surface} background={background} theme={theme} graphics={props.graphics} />
  })
  return (
    <box
      flexDirection="column"
      width="100%"
      backgroundColor={background()}
      border={props.active() ? ["top", "right", "bottom", "left"] : undefined}
      borderColor={props.active() ? reviewColors().cursor : undefined}
    >
      <Show when={props.startingComments().length > 0}>
        <box width="100%" flexDirection="row" justifyContent="flex-end">
          <text fg={reviewColors().comment} attributes={TextAttributes.BOLD}>
            comment {props.startingComments().map((comment) => `#${props.commentNumber(comment)}`).join(", ")}
          </text>
        </box>
      </Show>
      {view()}
      <Show when={props.active()}>
        <box paddingLeft={1} paddingRight={1} flexDirection="row" justifyContent="flex-end">
          <text fg={reviewColors().comment} attributes={TextAttributes.BOLD}>review cursor</text>
        </box>
      </Show>
    </box>
  )
}

type LocalRaster = {
  path: string
  image: NativeImage
  box: { columns: number; rows: number }
  cell: CellSize | null
}
type LocalImageResult = { raster: LocalRaster } | { error: string }

function LocalImage(props: {
  href: string
  alt: string
  base: () => string | undefined
  maxWidth: () => number
  background: RGBA
  theme: Plugin.Context["theme"]
  graphics: CanvasGraphics
}) {
  const theme = props.theme
  const [renderError, setRenderError] = createSignal<string>()
  // A rejected resource rethrows from its read, so an unreadable image would
  // abort the canvas unmount on the next key. Report failures as values instead.
  const [loaded] = createResource(
    () => ({ href: props.href, base: props.base(), columns: props.maxWidth(), cell: props.graphics.cell() }),
    async ({ href, base, columns, cell }): Promise<LocalImageResult> => {
      const resolved = resolveLocalImage(base, href)
      if (resolved.error !== undefined) return { error: resolved.error }
      if (resolved.path === undefined) return { error: "The image path is invalid" }
      const file = Bun.file(resolved.path)
      if (!(await file.exists())) return { error: `Image does not exist: ${href}` }
      const bytes = new Uint8Array(await file.arrayBuffer())
      const info = imageInfo(bytes)
      const box = imageBox(info.width, info.height, columns, cell ? cell.height / cell.width : 2)
      const target = { width: box.columns * (cell?.width ?? 8), height: box.rows * (cell?.height ?? 16) }
      const decoded = NativeImage.decode(bytes)
      const scale = Math.min(1, target.width / decoded.width, target.height / decoded.height)
      const resized = scale < 1
        ? decoded.resize({ width: Math.max(1, Math.round(decoded.width * scale)), height: Math.max(1, Math.round(decoded.height * scale)) })
        : decoded
      if (resized !== decoded) decoded.dispose()
      if (!info.hasAlpha) return { raster: { path: resolved.path, image: resized, box, cell } }
      const pixels = new Uint8Array(resized.width * resized.height * 4)
      const color = [props.background.r, props.background.g, props.background.b].map((channel) => Math.round(Math.max(0, Math.min(1, channel)) * 255))
      for (let index = 0; index < pixels.length; index += 4) {
        pixels[index] = color[0]!
        pixels[index + 1] = color[1]!
        pixels[index + 2] = color[2]!
        pixels[index + 3] = 255
      }
      const surface = NativeImage.fromRgba(pixels, resized.width, resized.height)
      const composited = surface.composite(resized)
      surface.dispose()
      resized.dispose()
      return { raster: { path: resolved.path, image: composited, box, cell } }
    },
  )
  const raster = () => {
    const value = loaded()
    return value && "raster" in value ? value.raster : undefined
  }
  const failure = () => {
    const value = loaded()
    return renderError() ?? (value && "error" in value ? value.error : undefined)
  }
  onCleanup(() => raster()?.image.dispose())
  const label = () => props.alt || props.href

  return (
    <box width="100%" flexDirection="column" flexShrink={0} overflow="hidden">
      <Switch>
        <Match when={loaded.loading}>
          <text fg={theme.text.muted}>Loading image: {label()}</text>
        </Match>
        <Match when={failure()}>
          <box flexDirection="column" border={["left"]} borderColor={theme.text.feedback.error.base} paddingLeft={1}>
            <text fg={theme.text.feedback.error.base}>Could not render image: {label()}</text>
            <text fg={theme.text.muted} wrapMode="word">{failure()}</text>
          </box>
        </Match>
        <Match when={raster()}>
          <image
            id={localImageID(raster()!.path, raster()!.box, raster()!.cell)}
            source={raster()!.image}
            fit="fit"
            protocol="auto"
            width={raster()!.box.columns}
            height={raster()!.box.rows}
            onError={(error) => setRenderError(error instanceof Error ? error.message : String(error))}
          />
        </Match>
      </Switch>
    </box>
  )
}

function CanvasCommentRails(props: {
  theme: Plugin.Context["theme"]
  columns: () => number
  rails: () => readonly ReviewCommentRail[]
  connector?: () => number | undefined
}) {
  const theme = props.theme
  const reviewColors = () => canvasReviewColors(theme)
  return (
    <box width={props.columns()} flexShrink={0} flexDirection="row">
      <For each={Array.from({ length: props.columns() }, (_, column) => column)}>
        {(column) => (
          <Show
            when={props.connector?.() === column}
            fallback={
              <Show when={props.rails().some((rail) => rail.column === column)} fallback={<box width={1} />}>
                <box width={1} height="100%" border={["left"]} borderColor={reviewColors().comment} />
              </Show>
            }
          >
            <box width={1} height="100%" flexDirection="column">
              <text fg={reviewColors().comment}>┤</text>
              <box flexGrow={1} minHeight={0} border={["left"]} borderColor={reviewColors().comment} />
            </box>
          </Show>
        )}
      </For>
    </box>
  )
}

function CanvasCommentCard(props: {
  theme: Plugin.Context["theme"]
  comment: ReviewSnapshot["comments"][number]
  number: number
  onDelete: (id: string) => void
  onEdit: (id: string) => void
}) {
  const theme = props.theme
  const reviewColors = () => canvasReviewColors(theme)
  return (
    <box paddingLeft={1} flexDirection="column" backgroundColor={reviewColors().commentBackground}>
      <box width="100%" flexDirection="row">
        <box flexGrow={1} minWidth={0} paddingLeft={1} paddingRight={1} flexDirection="row" justifyContent="flex-end" border={["top", "right", "bottom", "left"]} borderColor={reviewColors().comment}>
          <text fg={theme.text.base} attributes={TextAttributes.BOLD} wrapMode="word" flexShrink={1}>#{props.number + 1} {props.comment.message}</text>
        </box>
        <text width={3} fg={reviewColors().comment}>───</text>
      </box>
      <box paddingTop={1} paddingRight={1} gap={1} flexDirection="row" justifyContent="flex-end">
        <text fg={theme.text.muted} flexShrink={0} onMouseUp={() => props.onEdit(props.comment.id)}>edit</text>
        <text fg={theme.text.muted} flexShrink={0} onMouseUp={() => props.onDelete(props.comment.id)}>delete</text>
      </box>
    </box>
  )
}

// Display math owns its own block. Inline math flows with the text around it and
// is laid out by the canvas inline renderer instead.
function MathBlock(props: {
  content: string
  open: string
  close: string
  size: () => number
  maxWidth: () => number
  surface: () => string
  theme: Plugin.Context["theme"]
  graphics: CanvasGraphics
}) {
  const theme = props.theme
  const [failed, setFailed] = createSignal(false)
  const color = () => rgbaToHex(theme.text.base)
  // The block mosaic needs a larger measured formula, but kitty/sixel use the
  // selected display scale as-is. Both cases are rasterized at this exact scale.
  const scale = () => props.size() * mosaicScale(props.graphics.protocol())
  // Unrenderable TeX is a value here, not a rejected resource: reading a
  // rejected resource throws, which would abort the canvas on the next key.
  const [rendered] = createResource(
    () => ({ content: props.content, color: color(), background: props.surface(), cell: props.graphics.cell(), scale: scale() }),
    async (input): Promise<{ raster: MathImage } | { error: string }> => {
      try {
        return { raster: await renderMath(input.content, true, input.color, input.background, input.cell, input.scale) }
      } catch (error) {
        return { error: error instanceof Error ? error.message : String(error) }
      }
    },
  )
  const raster = () => {
    const value = rendered()
    return value && "raster" in value ? value.raster : undefined
  }
  const source = () => `${props.open}${props.content}${props.close}`
  const id = () => `artifact-canvas-math-${mathImageID(props.content, true, color(), props.graphics.cell(), scale())}`
  // `renderMath` already measured this image at the requested display scale, so
  // the layout must use its exact cell box rather than stretching a 1x raster.
  const box = () => {
    const image = raster()
    const columns = image ? image.columns : Math.min(24, props.maxWidth())
    const rows = image ? image.rows : 3
    const max = props.maxWidth()
    if (columns <= max) return { columns, rows }
    // Too wide for the canvas: shrink the whole box so it keeps its aspect ratio.
    return { columns: max, rows: Math.max(1, Math.round((rows * max) / columns)) }
  }

  return (
    <box width="100%" flexShrink={0} flexDirection="column">
      <Switch>
        <Match when={rendered.loading}>
          <text fg={theme.text.muted}>Rendering math...</text>
        </Match>
        <Match when={failed() || (rendered() && "error" in rendered()!)}>
          <box flexDirection="column" border={["left"]} borderColor={theme.text.feedback.error.base} paddingLeft={1}>
            <text fg={theme.text.feedback.error.base}>Could not render TeX; showing source</text>
            <text fg={theme.text.base} wrapMode="word">
              {source()}
            </text>
          </box>
        </Match>
        <Match when={raster()}>
          <box width="100%" height={box().rows} flexShrink={0} alignItems="center">
            <image
              id={id()}
              source={raster()!.bytes}
              fit="fit"
              protocol="auto"
              width={box().columns}
              height={box().rows}
              onError={() => setFailed(true)}
            />
          </box>
        </Match>
      </Switch>
    </box>
  )
}

function toggleMode(mode: CanvasMode): CanvasMode {
  if (mode === "rendered") return "source"
  return "rendered"
}

async function editArtifact(
  context: Plugin.Context,
  file: string | undefined,
  cwd: string,
  refetch: () => void,
) {
  if (!file) return
  const editor = process.env.VISUAL || process.env.EDITOR
  if (!editor) {
    context.ui.toast.show({ variant: "warning", message: "Set VISUAL or EDITOR to edit the artifact" })
    return
  }
  context.renderer.suspend()
  context.renderer.currentRenderBuffer.clear()
  try {
    await new Promise<void>((resolve, reject) => {
      const parts = editor.split(" ")
      const child = spawn(parts[0]!, [...parts.slice(1), file], {
        cwd,
        stdio: "inherit",
        shell: process.platform === "win32",
      })
      child.on("error", reject)
      child.on("exit", (code, signal) => {
        if (code === 0) return resolve()
        reject(new Error(`Editor exited with ${signal ? `signal ${signal}` : `code ${code}`}`))
      })
    })
    refetch()
  } catch (error) {
    context.ui.toast.show({ variant: "error", message: error instanceof Error ? error.message : String(error) })
  } finally {
    context.renderer.currentRenderBuffer.clear()
    context.renderer.resume()
    context.renderer.requestRender()
  }
}

export default {
  id: "opencode.artifact-canvas",
  setup(context: Plugin.Context) {
    // Canvas files often document LaTeX syntax, so only Mermaid fences opt into custom rendering here.
    const renderNode = createMarkdownCodeBlockRenderer({
      mermaid: createMermaidCodeBlockRenderer(context.renderer, () => ({
        colors: resolveOpenCodeDiagramPalette(context.theme, context.themeMode),
      })),
    })
    const [file, setFile] = createSignal<string>()
    const [previous, setPrevious] = createSignal({ ...context.ui.router.current() })
    // Inline math remains tied to its text row. Display math can be measured at a
    // fine scale, and each step rerasterizes the formula rather than magnifying a
    // 1x PNG. Existing whole-number settings are still valid values and clamp to
    // the new display range on first read.
    const [settings, updateSettings] = context.storage.store<{ mathScale: number }>("canvas", {
      initial: { mathScale: 1 },
    })
    const mathSize = () => Math.min(2, Math.max(0.5, Math.round((settings.mathScale ?? 1) * 10) / 10))
    const resizeMath = (delta: number) => {
      const next = Math.min(2, Math.max(0.5, Math.round((mathSize() + delta * 0.1) * 10) / 10))
      void updateSettings((draft) => {
        draft.mathScale = next
      })
    }

    context.ui.router.register({
      name: "artifact-canvas",
      render: () => (
        <RendererContext.Provider value={context.renderer}>
          <CanvasPage
            context={context}
            renderNode={renderNode}
            file={file}
            onClose={() => context.ui.router.navigate(previous())}
            presentation="fullscreen"
            sessionID={() => {
              const route = previous()
              return route.type === "session" ? route.sessionID : undefined
            }}
            mathSize={mathSize}
            onMathSize={resizeMath}
          />
        </RendererContext.Provider>
      ),
    })
    context.ui.slot({
      replace: "session.panel",
      render(input) {
        if (input.name !== "artifact-canvas") return null
        return (
          <RendererContext.Provider value={context.renderer}>
            <CanvasPage
              context={context}
              renderNode={renderNode}
              file={file}
              onClose={input.close}
              active={() => input.focused}
              presentation={input.presentation}
              sessionID={() => input.sessionID}
              mathSize={mathSize}
              onMathSize={resizeMath}
            />
          </RendererContext.Provider>
        )
      },
    })
    context.ui.slot({
      append: "app",
      render() {
          context.keymap.layer(() => ({
          mode: "global",
          commands: [
            {
              id: "canvas.open",
              title: "Open artifact canvas",
              description: "Render a Markdown artifact with TeX math",
              group: "System",
              palette: true,
              slash: { name: "canvas", arguments: true },
              run(input?: string) {
                const current = context.ui.router.current()
                setFile(input?.trim() ? path.resolve(process.cwd(), input.trim()) : undefined)
                context.ui.dialog.clear()
                if (context.ui.panel.open("artifact-canvas", { presentation: "panel" })) return
                if (current.type === "session") {
                  context.ui.toast.show({
                    variant: "warning",
                    message: "Canvas panel could not open; falling back to fullscreen",
                  })
                }
                if (current.type !== "plugin" || current.name !== "artifact-canvas") setPrevious({ ...current })
                context.ui.router.navigate({ type: "plugin", name: "artifact-canvas" })
              },
            },
          ],
        }))
        return null
      },
    })
  },
}
