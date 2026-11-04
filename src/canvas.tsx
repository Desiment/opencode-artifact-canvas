import type { Plugin } from "@opencode/plugin/tui"
import { BaseRenderable, TextAttributes, type RGBA } from "@opentui/core"
import { spawn } from "node:child_process"
import path from "node:path"
import {
  MarkdownRenderer,
  parseDocument,
  rgbaToHex,
  useCanvasGraphics,
  type Document,
  type RenderUnit,
  type UnitInfo,
} from "opentui-markdown-render"
import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
  For,
  Match,
  Show,
  Switch,
  type Accessor,
  type JSX,
} from "solid-js"
import {
  addReviewComment,
  assignCommentRails,
  buildGeneralMessageDraft,
  deleteReviewComment,
  startReview,
  updateReviewComment,
  type ArtifactAtomKind,
  type ReviewCommentRail,
  type ReviewSnapshot,
} from "./review"
import { rendererTheme } from "./theme"

type CanvasMode = "rendered" | "source"
export type CanvasPhase = "edit" | "review"
type CanvasContent = { file: string; value?: string; error?: string }
type CanvasDialogSection = {
  readonly title: string
  readonly rows: readonly { readonly label: string; readonly value: string }[]
}

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

export function documentReviewUnits(document: Document): UnitInfo[] {
  const units: UnitInfo[] = []
  for (const block of document.blocks) {
    if (block.type === "list") {
      for (const item of block.items) units.push({ kind: "list-item", item, source: item.source })
    } else {
      units.push({ kind: "block", block, source: block.source })
    }
  }
  return units
}

export function unitAtomKind(info: UnitInfo): ArtifactAtomKind {
  if (info.kind === "block" && info.block.type === "display-math") return "formula"
  if (info.kind === "block" && info.block.type === "mermaid") return "mermaid"
  return "text"
}

function sameRange(left: UnitInfo["source"], right: UnitInfo["source"]) {
  return left?.start === right?.start && left?.end === right?.end
}

function unitIndex(units: readonly UnitInfo[], info: UnitInfo) {
  const identity = units.findIndex((unit) =>
    unit.kind === info.kind && (unit.kind === "block" ? unit.block === (info.kind === "block" && info.block) : unit.item === (info.kind === "list-item" && info.item)),
  )
  if (identity >= 0) return identity
  return units.findIndex((unit) => unit.kind === info.kind && sameRange(unit.source, info.source))
}

export function visualSelectionContains(
  units: readonly UnitInfo[],
  info: UnitInfo,
  cursor: number,
  visualStart: number | undefined,
) {
  if (visualStart === undefined) return false
  const index = unitIndex(units, info)
  return index >= Math.min(visualStart, cursor) && index <= Math.max(visualStart, cursor)
}

export function commentRangeContains(
  units: readonly UnitInfo[],
  info: UnitInfo,
  rails: readonly ReviewCommentRail[],
) {
  const index = unitIndex(units, info)
  return index >= 0 && rails.some((rail) => rail.start <= index && rail.end >= index)
}

export async function confirmReviewExit(
  dialog: Pick<Plugin.Context["ui"]["dialog"], "confirm">,
  commentCount: number,
) {
  return await dialog.confirm({
    title: "Leave review mode?",
    message: commentCount
      ? `This will discard the active review and ${commentCount} unsent comment${commentCount === 1 ? "" : "s"}.`
      : "This will discard the active review selection and return to editing mode.",
    label: { confirm: "Leave review", cancel: "Keep reviewing" },
  }) === true
}

function CanvasDetailsDialog(props: {
  context: Plugin.Context
  title: string
  sections: readonly CanvasDialogSection[]
}) {
  const theme = props.context.theme.surface("dialog")
  const close = () => props.context.ui.dialog.clear()
  props.context.keymap.layer(() => ({
    mode: "modal",
    commands: [{ bind: "return", title: "close Canvas information", run: close }],
  }))
  return <box paddingLeft={2} paddingRight={2} gap={1}>
    <box flexDirection="row" justifyContent="space-between">
      <text fg={theme.text.base} attributes={TextAttributes.BOLD}>{props.title}</text>
      <text fg={theme.text.muted} onMouseUp={close}>esc</text>
    </box>
    <For each={props.sections}>{(section) => {
      const labelWidth = Math.max(10, ...section.rows.map((row) => row.label.length + 2))
      return <box flexDirection="column">
        <text fg={theme.text.base} attributes={TextAttributes.BOLD}>{section.title}</text>
        <For each={section.rows}>{(row) => <box flexDirection="row" width="100%">
          <text width={labelWidth} flexShrink={0} fg={theme.text.action.primary.base} attributes={TextAttributes.BOLD}>{row.label}</text>
          <text flexGrow={1} minWidth={0} wrapMode="word" fg={theme.text.base}>{row.value}</text>
        </box>}</For>
      </box>
    }}</For>
    <box flexDirection="row" justifyContent="flex-end" paddingBottom={1}>
      <box paddingLeft={3} paddingRight={3} backgroundColor={theme.background.action.primary.focused} onMouseUp={close}>
        <text fg={theme.text.action.primary.focused}>close</text>
      </box>
    </box>
  </box>
}

function CanvasPage(props: {
  context: Plugin.Context
  file: () => string | undefined
  onClose: () => void
  active?: () => boolean
  presentation: string
  sessionID?: () => string | undefined
}) {
  const theme = props.context.theme
  const cwd = process.cwd()
  const graphics = useCanvasGraphics(props.context.renderer)
  const renderTheme = createMemo(() => rendererTheme(props.context))
  const [mode, setMode] = createSignal<CanvasMode>("rendered")
  const [phase, setPhase] = createSignal<CanvasPhase>("edit")
  const [baseline, setBaseline] = createSignal<string>()
  const [review, setReview] = createSignal<ReviewSnapshot>()
  const [cursor, setCursor] = createSignal(0)
  const [visualStart, setVisualStart] = createSignal<number>()
  const [width, setWidth] = createSignal(0)
  const [content, { refetch }] = createResource(props.file, async (file): Promise<CanvasContent | undefined> => {
    if (!file) return undefined
    const artifact = Bun.file(file)
    if (!(await artifact.exists())) return { file, error: `Artifact does not exist: ${file}` }
    try {
      return { file, value: await artifact.text() }
    } catch (error) {
      return { file, error: error instanceof Error ? error.message : String(error) }
    }
  })
  const loaded = () => {
    const result = content()
    return result?.file === props.file() ? result : undefined
  }
  const document = createMemo(() => parseDocument(loaded()?.value ?? ""))
  const units = createMemo(() => documentReviewUnits(document()))
  const rails = createMemo(() => assignCommentRails(
    review()?.comments ?? [],
    units().map((unit) => unit.source ?? { start: -1, end: -1 }),
  ))
  const railCount = createMemo(() => Math.max(0, ...rails().map((rail) => rail.column + 1)))
  const available = () => Math.max(8, width() - 4 - railCount())
  let baselineFile: string | undefined

  createEffect(() => {
    const file = props.file()
    const value = loaded()?.value
    if (!file || value === undefined || baselineFile === file) return
    baselineFile = file
    setBaseline(value)
    setPhase("edit")
    setReview()
    setCursor(0)
    setVisualStart()
  })
  createEffect(() => {
    const last = Math.max(0, units().length - 1)
    if (cursor() > last) setCursor(last)
  })

  const selectedRange = () => {
    const items = units()
    const start = visualStart()
    if (start === undefined || !items.length) return undefined
    const from = Math.min(start, cursor())
    const to = Math.max(start, cursor())
    const first = items[from]
    const last = items[to]
    if (!first?.source || !last?.source) return undefined
    return {
      start: first.source.start,
      end: last.source.end,
      atomKind: from === to ? unitAtomKind(first) : "text",
    } as const
  }
  const moveCursor = (delta: number) =>
    setCursor((value) => Math.max(0, Math.min(Math.max(0, units().length - 1), value + delta)))
  const enterReview = () => {
    const value = loaded()?.value
    if (value === undefined) return
    setReview(startReview(baseline() ?? value, value))
    setPhase("review")
    setMode("rendered")
    setCursor(0)
    setVisualStart()
  }
  const discardReview = () => {
    setPhase("edit")
    setReview()
    setVisualStart()
  }
  const requestReviewExit = async () => {
    if (phase() !== "review") return true
    return confirmReviewExit(props.context.ui.dialog, review()?.comments.length ?? 0)
  }
  const leaveReview = async () => {
    if (!await requestReviewExit()) return
    discardReview()
  }
  const closeCanvas = async () => {
    if (!await requestReviewExit()) return
    if (phase() === "review") discardReview()
    props.onClose()
  }
  const showHelp = () => {
    props.context.ui.dialog.show(() => <CanvasDetailsDialog context={props.context} title="Artifact Canvas help" sections={[
      { title: "GENERAL", rows: [
        { label: "h", value: "Show this help" },
        { label: "c", value: "Show Canvas configuration and runtime information" },
        { label: "q", value: "Close Canvas (asks first during review)" },
        { label: "Esc", value: "Cancel a visual selection, otherwise close Canvas" },
      ] },
      { title: "VIEWING AND EDITING", rows: [
        { label: "s", value: "Switch between rendered Markdown and source" },
        { label: "e", value: "Open the artifact in $VISUAL or $EDITOR" },
        { label: "r", value: "Start review mode; in review mode, ask before leaving" },
      ] },
      { title: "REVIEW MODE", rows: [
        { label: "j / ↓", value: "Move to the next review block" },
        { label: "k / ↑", value: "Move to the previous review block" },
        { label: "v", value: "Start or extend a visual block selection" },
        { label: "a", value: "Add a comment to the selected block range" },
        { label: "d", value: "Delete the comment matching the selected range" },
        { label: "Shift+S", value: "Compose and send all review feedback to the session" },
        { label: "Esc", value: "Cancel the current selection before closing" },
      ] },
      { title: "CURRENT STATE", rows: [
        { label: "Mode", value: `${mode()} / ${phase()}` },
      ] },
    ]} />)
    props.context.ui.dialog.set({ size: "large", centered: true })
  }
  const showInformation = () => {
    const cell = graphics.cell()
    const current = review()
    props.context.ui.dialog.show(() => <CanvasDetailsDialog context={props.context} title="Canvas configuration & runtime" sections={[
      { title: "CONFIGURATION", rows: [
        { label: "File", value: props.file() ?? "No artifact selected" },
        { label: "Working directory", value: cwd },
        { label: "Renderer config", value: "Canvas-managed (file discovery disabled)" },
        { label: "Images", value: "Maximum 24 rows" },
        { label: "Display math", value: "Fixed native size (resize controls disabled)" },
      ] },
      { title: "RUNTIME", rows: [
        { label: "Presentation", value: props.presentation },
        { label: "View", value: mode() },
        { label: "Review", value: phase() },
        { label: "Review blocks", value: String(units().length) },
        { label: "Review comments", value: String(current?.comments.length ?? 0) },
        { label: "Canvas width", value: `${width()} columns` },
        { label: "Document width", value: `${available()} columns` },
        { label: "Graphics protocol", value: graphics.protocol() },
        { label: "Cell pixels", value: cell ? `${cell.width}x${cell.height}` : "unknown" },
      ] },
    ]} />)
    props.context.ui.dialog.set({ size: "large", centered: true })
  }
  const addComment = async () => {
    const range = selectedRange()
    if (!range) {
      props.context.ui.toast.show({ variant: "warning", message: "Select review blocks with exact source ranges first" })
      return
    }
    const message = await props.context.ui.dialog.prompt({ title: "Review comment", placeholder: "What should change?" })
    if (!message?.trim() || !review()) return
    setReview((value) => value
      ? addReviewComment(value, { id: crypto.randomUUID(), range, message: message.trim() })
      : value)
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
    await props.context.client.session.prompt({
      sessionID,
      text: buildGeneralMessageDraft(current, general, file ?? "artifact.md"),
      delivery: "steer",
    }).then(() => props.context.ui.toast.show({ variant: "success", message: "Review feedback sent" }))
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
    if (message !== undefined) setReview(updateReviewComment(current, id, { message: message.trim() }))
  }

  props.context.keymap.layer(() => ({
    enabled: () => props.active?.() ?? true,
    commands: [
      { bind: "escape", title: "back", run: () => visualStart() !== undefined ? setVisualStart() : void closeCanvas() },
      { bind: "s", title: mode() === "source" ? "rendered" : "source", run: () => setMode(mode() === "source" ? "rendered" : "source") },
      {
        bind: "e",
        title: "edit artifact",
        run: () => phase() === "review"
          ? props.context.ui.toast.show({ variant: "warning", message: "Leave review mode before editing the artifact" })
          : void editArtifact(props.context, props.file(), cwd, refetch),
      },
      { bind: "r", title: phase() === "review" ? "leave review" : "start review", run: () => phase() === "review" ? void leaveReview() : enterReview() },
      { bind: "q", title: "close canvas", run: () => void closeCanvas() },
      { bind: "h", title: "canvas help", run: () => void showHelp() },
      { bind: "c", title: "canvas configuration and runtime", run: () => void showInformation() },
      { bind: "j", title: "next block", enabled: () => phase() === "review", run: () => moveCursor(1) },
      { bind: "down", title: "next block", enabled: () => phase() === "review", run: () => moveCursor(1) },
      { bind: "k", title: "previous block", enabled: () => phase() === "review", run: () => moveCursor(-1) },
      { bind: "up", title: "previous block", enabled: () => phase() === "review", run: () => moveCursor(-1) },
      { bind: "v", title: "visual select", enabled: () => phase() === "review", run: () => setVisualStart((value) => value ?? cursor()) },
      { bind: "a", title: "comment selection", enabled: () => phase() === "review", run: () => void addComment() },
      {
        bind: "d",
        title: "delete selected comment",
        enabled: () => phase() === "review",
        run: () => {
          const range = selectedRange()
          const current = review()
          const comment = range && current?.comments.find((item) => item.range.start === range.start && item.range.end === range.end)
          if (comment && current) setReview(deleteReviewComment(current, comment.id))
        },
      },
      { bind: "shift+s", title: "compose review feedback", enabled: () => phase() === "review", run: () => void sendReview() },
    ],
  }))

  const label = () => {
    const file = props.file()
    return file ? path.relative(cwd, file) || file : "No artifact selected"
  }
  const selected = (info: UnitInfo) => phase() === "review" && visualSelectionContains(units(), info, cursor(), visualStart())
  const commented = (info: UnitInfo) => commentRangeContains(units(), info, rails())
  const renderUnit: RenderUnit = (info, rendered) => (
    <CanvasReviewUnit
      info={info}
      rendered={rendered}
      units={units}
      rails={rails}
      railCount={railCount}
      review={review}
      phase={phase}
      cursor={cursor}
      visualStart={visualStart}
      theme={theme}
      onDelete={(id) => setReview((value) => value ? deleteReviewComment(value, id) : value)}
      onEdit={editComment}
    />
  )

  return (
    <box width="100%" height="100%" backgroundColor={theme.background.base} flexDirection="column"
      border={props.presentation === "panel" ? ["left"] : false} borderColor={theme.border.base}
      onSizeChange={function () { setWidth(this.width) }}>
      <box flexShrink={0} flexDirection="row" gap={1} paddingLeft={1} paddingRight={1}
        border={["bottom"]} borderColor={theme.decrease(theme.background.base)}>
        <text fg={theme.text.muted} flexGrow={1} minWidth={0} wrapMode="none" truncate>{label()}</text>
        <text fg={theme.text.muted} flexShrink={0}>h help  q quit</text>
      </box>
      <scrollbox flexGrow={1} contentOptions={{ minHeight: "100%", paddingLeft: 2, paddingRight: 2, paddingTop: 1, paddingBottom: 1 }}>
        <Switch>
          <Match when={!props.file()}>
            <box flexDirection="column" gap={1}>
              <text fg={theme.text.base} attributes={TextAttributes.BOLD}>Open a Markdown artifact with /canvas path/to/file.md</text>
              <text fg={theme.text.muted}>Rendered mode supports Markdown, math, Mermaid, tables, and local images.</text>
            </box>
          </Match>
          <Match when={loaded()?.error}>
            <box flexDirection="column" gap={1}>
              <text fg={theme.text.feedback.error.base}>Could not load artifact</text>
              <text fg={theme.text.muted}>{loaded()!.error}</text>
            </box>
          </Match>
          <Match when={content.loading}><text fg={theme.text.muted}>Loading artifact...</text></Match>
          <Match when={loaded()?.value !== undefined}>
            <Show when={mode() === "rendered"} fallback={<text fg={theme.text.base} wrapMode="word">{loaded()!.value}</text>}>
              <MarkdownRenderer
                document={document}
                renderer={props.context.renderer}
                columns={available}
                assetBase={() => props.file() ? path.dirname(props.file()!) : undefined}
                theme={renderTheme}
                frame={{ enabled: false }}
                config={{ images: { maxRows: 24 } }}
                discoverConfig={false}
                renderUnit={renderUnit}
                unitSurface={(info) => {
                  const colors = canvasReviewColors(theme)
                  if (selected(info())) return rgbaToHex(colors.selection)
                  if (commented(info())) return rgbaToHex(colors.commentBackground)
                  return undefined
                }}
                onDiagnostic={({ message }) => props.context.ui.toast.show({ variant: "warning", message })}
              />
            </Show>
          </Match>
        </Switch>
      </scrollbox>
    </box>
  )
}

function CanvasReviewUnit(props: {
  info: Accessor<UnitInfo>
  rendered: JSX.Element
  units: Accessor<readonly UnitInfo[]>
  rails: Accessor<readonly ReviewCommentRail[]>
  railCount: Accessor<number>
  review: Accessor<ReviewSnapshot | undefined>
  phase: Accessor<CanvasPhase>
  cursor: Accessor<number>
  visualStart: Accessor<number | undefined>
  theme: Plugin.Context["theme"]
  onDelete: (id: string) => void
  onEdit: (id: string) => void
}) {
  const index = () => unitIndex(props.units(), props.info())
  const colors = () => canvasReviewColors(props.theme)
  const activeRails = () => props.rails().filter((rail) => rail.start <= index() && rail.end >= index())
  const endingRails = () => props.rails().filter((rail) => rail.end === index())
  const selected = () => {
    return props.phase() === "review" && visualSelectionContains(props.units(), props.info(), props.cursor(), props.visualStart())
  }
  const active = () => props.phase() === "review" && index() === props.cursor()
  const commented = () => activeRails().length > 0
  return <>
    <box width="100%" flexDirection="row">
      <box flexGrow={1} minWidth={0} flexDirection="column" backgroundColor={selected() ? colors().selection : commented() ? colors().commentBackground : undefined}
        border={active() ? ["top", "right", "bottom", "left"] : undefined} borderColor={active() ? colors().cursor : undefined}>
        <Show when={activeRails().some((rail) => rail.start === index())}>
          <box width="100%" flexDirection="row" justifyContent="flex-end">
            <text fg={colors().comment} attributes={TextAttributes.BOLD}>
              comment {activeRails().filter((rail) => rail.start === index()).map((rail) => `#${(props.review()?.comments.indexOf(rail.comment) ?? -1) + 1}`).join(", ")}
            </text>
          </box>
        </Show>
        {props.rendered}
        <Show when={active()}><box paddingLeft={1} paddingRight={1} flexDirection="row" justifyContent="flex-end">
          <text fg={colors().comment} attributes={TextAttributes.BOLD}>review cursor</text>
        </box></Show>
      </box>
      <CanvasCommentRails theme={props.theme} columns={props.railCount} rails={activeRails} />
    </box>
    <For each={endingRails()}>{(rail) => <box width="100%" flexDirection="row">
      <box flexGrow={1} minWidth={0}><CanvasCommentCard theme={props.theme} comment={rail.comment}
        number={props.review()?.comments.indexOf(rail.comment) ?? -1} onDelete={props.onDelete} onEdit={props.onEdit} /></box>
      <CanvasCommentRails theme={props.theme} columns={props.railCount} rails={activeRails} connector={() => rail.column} />
    </box>}</For>
  </>
}

function CanvasCommentRails(props: {
  theme: Plugin.Context["theme"]
  columns: () => number
  rails: () => readonly ReviewCommentRail[]
  connector?: () => number | undefined
}) {
  const colors = () => canvasReviewColors(props.theme)
  return <box width={props.columns()} flexShrink={0} flexDirection="row">
    <For each={Array.from({ length: props.columns() }, (_, column) => column)}>{(column) =>
      <Show when={props.connector?.() === column} fallback={
        <Show when={props.rails().some((rail) => rail.column === column)} fallback={<box width={1} />}>
          <box width={1} height="100%" border={["left"]} borderColor={colors().comment} />
        </Show>
      }>
        <box width={1} height="100%" flexDirection="column">
          <text fg={colors().comment}>┤</text>
          <box flexGrow={1} minHeight={0} border={["left"]} borderColor={colors().comment} />
        </box>
      </Show>}
    </For>
  </box>
}

function CanvasCommentCard(props: {
  theme: Plugin.Context["theme"]
  comment: ReviewSnapshot["comments"][number]
  number: number
  onDelete: (id: string) => void
  onEdit: (id: string) => void
}) {
  const colors = () => canvasReviewColors(props.theme)
  return <box paddingLeft={1} flexDirection="column" backgroundColor={colors().commentBackground}>
    <box width="100%" flexDirection="row">
      <box flexGrow={1} minWidth={0} paddingLeft={1} paddingRight={1} flexDirection="row" justifyContent="flex-end"
        border={["top", "right", "bottom", "left"]} borderColor={colors().comment}>
        <text fg={props.theme.text.base} attributes={TextAttributes.BOLD} wrapMode="word" flexShrink={1}>#{props.number + 1} {props.comment.message}</text>
      </box>
      <text width={3} fg={colors().comment}>───</text>
    </box>
    <box paddingTop={1} paddingRight={1} gap={1} flexDirection="row" justifyContent="flex-end">
      <text fg={props.theme.text.muted} flexShrink={0} onMouseUp={() => props.onEdit(props.comment.id)}>edit</text>
      <text fg={props.theme.text.muted} flexShrink={0} onMouseUp={() => props.onDelete(props.comment.id)}>delete</text>
    </box>
  </box>
}

async function editArtifact(context: Plugin.Context, file: string | undefined, cwd: string, refetch: () => void) {
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
      const child = spawn(parts[0]!, [...parts.slice(1), file], { cwd, stdio: "inherit", shell: process.platform === "win32" })
      child.on("error", reject)
      child.on("exit", (code, signal) => code === 0 ? resolve() : reject(new Error(`Editor exited with ${signal ? `signal ${signal}` : `code ${code}`}`)))
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
    if (process.env.OPENCODE_ARTIFACT_CANVAS_LINKAGE_DEBUG) {
      console.error("[artifact-canvas] host OpenTUI identity:", context.renderer.root instanceof BaseRenderable)
    }
    const [file, setFile] = createSignal<string>()
    const [previous, setPrevious] = createSignal({ ...context.ui.router.current() })
    context.ui.router.register({
      name: "artifact-canvas",
      render: () => <CanvasPage context={context} file={file} onClose={() => context.ui.router.navigate(previous())}
        presentation="fullscreen" sessionID={() => {
          const route = previous()
          return route.type === "session" ? route.sessionID : undefined
        }} />,
    })
    context.ui.slot({
      append: "session.panel",
      render(input) {
        if (input.name !== "artifact-canvas") return null
        return <CanvasPage context={context} file={file} onClose={input.close} active={() => input.focused}
          presentation={input.presentation} sessionID={() => input.sessionID} />
      },
    })
    context.ui.slot({
      append: "app",
      render() {
        context.keymap.layer(() => ({
          mode: "global",
          commands: [{
            id: "canvas.open",
            title: "Open artifact canvas",
            description: "Render and review a Markdown artifact",
            group: "System",
            palette: true,
            slash: { name: "canvas", arguments: true },
            run(input?: string) {
              const current = context.ui.router.current()
              setFile(input?.trim() ? path.resolve(process.cwd(), input.trim()) : undefined)
              context.ui.dialog.clear()
              if (context.ui.panel.open("artifact-canvas", { presentation: "panel" })) return
              if (current.type === "session") context.ui.toast.show({ variant: "warning", message: "Canvas panel could not open; falling back to fullscreen" })
              if (current.type !== "plugin" || current.name !== "artifact-canvas") setPrevious({ ...current })
              context.ui.router.navigate({ type: "plugin", name: "artifact-canvas" })
            },
          }],
        }))
        return null
      },
    })
  },
}
