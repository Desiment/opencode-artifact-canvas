import { describe, expect, test } from "bun:test"
import {
  addReviewComment,
  assignCommentRails,
  buildGeneralMessageDraft,
  buildUnifiedDiff,
  commentEndsInBlock,
  commentOverlapsBlock,
  deleteReviewComment,
  startReview,
  updateReviewComment,
  type ReviewComment,
} from "../src/review"
import { commentRangeContains, confirmReviewExit, documentReviewUnits, unitAtomKind, visualSelectionContains } from "../src/canvas"
import { parseDocument } from "opentui-markdown-render"

describe("artifact canvas review state", () => {
  const formulaComment: ReviewComment = {
    id: "formula-1",
    range: { start: 8, end: 13, atomKind: "formula" },
    message: "Define each variable.",
  }

  const mermaidComment: ReviewComment = {
    id: "mermaid-1",
    range: { start: 15, end: 42, atomKind: "mermaid" },
    message: "Show the retry path.",
  }

  test("starts a review with the baseline, current source, and no comments", () => {
    expect(startReview("# Before\n", "# After\n")).toEqual({
      baseline: "# Before\n",
      current: "# After\n",
      comments: [],
    })
  })

  test("adds formula and Mermaid comments without changing the prior snapshot", () => {
    const review = startReview("", "formula\nmermaid")
    const withFormula = addReviewComment(review, formulaComment)
    const withBoth = addReviewComment(withFormula, mermaidComment)

    expect(review.comments).toEqual([])
    expect(withFormula.comments).toEqual([formulaComment])
    expect(withBoth.comments).toEqual([formulaComment, mermaidComment])
  })

  test("updates a comment while preserving its id and leaves unknown comments untouched", () => {
    const review = addReviewComment(startReview("", "formula"), formulaComment)
    const updated = updateReviewComment(review, formulaComment.id, {
      range: { start: 9, end: 14, atomKind: "formula" },
      message: "Define every variable.",
    })

    expect(updated.comments).toEqual([
      {
        id: "formula-1",
        range: { start: 9, end: 14, atomKind: "formula" },
        message: "Define every variable.",
      },
    ])
    expect(review.comments).toEqual([formulaComment])
    expect(updateReviewComment(updated, "missing", { message: "Ignored" })).toBe(updated)
  })

  test("deletes comments immutably and treats an unknown id as a no-op", () => {
    const review = addReviewComment(addReviewComment(startReview("", ""), formulaComment), mermaidComment)
    const deleted = deleteReviewComment(review, formulaComment.id)

    expect(deleted.comments).toEqual([mermaidComment])
    expect(review.comments).toEqual([formulaComment, mermaidComment])
    expect(deleteReviewComment(deleted, "missing")).toBe(deleted)
  })

  test("anchors multi-block comments after the block containing their final source offset", () => {
    const plain = { ...formulaComment, range: { start: 0, end: 24, atomKind: "text" as const } }
    const formula = { ...formulaComment, range: { start: 0, end: 39, atomKind: "formula" as const } }
    const mermaid = { ...mermaidComment, range: { start: 0, end: 82, atomKind: "mermaid" as const } }

    expect(commentEndsInBlock(plain, { start: 12, end: 24 })).toBe(true)
    expect(commentEndsInBlock(plain, { start: 0, end: 11 })).toBe(false)
    expect(commentEndsInBlock(formula, { start: 25, end: 39 })).toBe(true)
    expect(commentEndsInBlock(mermaid, { start: 40, end: 82 })).toBe(true)
    expect(commentOverlapsBlock(plain, { start: 0, end: 11 })).toBe(true)
    expect(commentOverlapsBlock(plain, { start: 12, end: 24 })).toBe(true)
    expect(commentOverlapsBlock(plain, { start: 24, end: 36 })).toBe(false)
  })

  test("assigns overlapping multi-block comments to adjacent rails", () => {
    const blocks = [{ start: 0, end: 10 }, { start: 10, end: 20 }, { start: 20, end: 30 }, { start: 30, end: 40 }]
    const first = { ...formulaComment, range: { start: 0, end: 30, atomKind: "text" as const } }
    const second = { ...mermaidComment, range: { start: 10, end: 40, atomKind: "text" as const } }
    const third = { ...formulaComment, id: "formula-2", range: { start: 30, end: 40, atomKind: "text" as const } }

    expect(assignCommentRails([first, second, third], blocks)).toEqual([
      { comment: first, start: 0, end: 2, column: 0 },
      { comment: second, start: 1, end: 3, column: 1 },
      { comment: third, start: 3, end: 3, column: 0 },
    ])
  })

  test("keeps Markdown, display formulas, and Mermaid as separate comment rail blocks", () => {
    const source = "Text.\n\n$$x^2$$\n\n```mermaid\nflowchart LR\n  A --> B\n```\n"
    const blocks = documentReviewUnits(parseDocument(source))
    const comment = { ...formulaComment, range: { start: 0, end: source.length, atomKind: "text" as const } }

    expect(blocks.map((unit) => unit.kind === "block" ? unit.block.type : unit.kind)).toEqual(["paragraph", "display-math", "mermaid"])
    expect(blocks.map(unitAtomKind)).toEqual(["text", "formula", "mermaid"])
    expect(assignCommentRails([comment], blocks.map((block) => block.source!))).toEqual([
      { comment, start: 0, end: 2, column: 0 },
    ])
  })

  test("keeps standalone local Markdown images as reviewable blocks", () => {
    const source = "Before\n\n![Chart](assets/chart.webp)\n\nAfter\n"
    const blocks = documentReviewUnits(parseDocument(source))

    expect(blocks.map((unit) => unit.kind === "block" ? unit.block.type : unit.kind)).toEqual(["paragraph", "image", "paragraph"])
    expect(blocks[1]).toMatchObject({
      kind: "block",
      block: { type: "image", href: "assets/chart.webp", alt: "Chart" },
      source: { start: 8, end: 35 },
    })
  })

  test("uses list items as non-overlapping review units", () => {
    const source = "- first\n- second\n"
    const units = documentReviewUnits(parseDocument(source))
    expect(units.map((unit) => unit.kind)).toEqual(["list-item", "list-item"])
    expect(units.map((unit) => unit.source && source.slice(unit.source.start, unit.source.end))).toEqual(["- first\n", "- second"])
  })

  test("includes every block in a forward or reverse visual range", () => {
    const units = documentReviewUnits(parseDocument("# Heading\n\nParagraph\n\n$$\nx^2\n$$\n\nTail"))
    expect(units).toHaveLength(4)
    expect(units.map((unit) => visualSelectionContains(units, unit, 2, 0))).toEqual([true, true, true, false])
    expect(units.map((unit) => visualSelectionContains(units, unit, 0, 2))).toEqual([true, true, true, false])
    expect(units.map((unit) => visualSelectionContains(units, unit, 2, undefined))).toEqual([false, false, false, false])
  })

  test("keeps every commented block marked after visual selection ends", () => {
    const units = documentReviewUnits(parseDocument("# Heading\n\nParagraph\n\n$$\nx^2\n$$\n\nTail"))
    const first = units[0]?.source
    const last = units[2]?.source
    if (!first || !last) throw new Error("expected review ranges")
    const comment = { ...formulaComment, range: { start: first.start, end: last.end, atomKind: "text" as const } }
    const rails = assignCommentRails([comment], units.map((unit) => unit.source!))
    expect(units.map((unit) => commentRangeContains(units, unit, rails))).toEqual([true, true, true, false])
  })

  test("only leaves review after explicit confirmation", async () => {
    let message = ""
    const dialog = (answer: boolean | undefined) => ({
      confirm: async (options: { message: string }) => {
        message = options.message
        return answer
      },
    })
    expect(await confirmReviewExit(dialog(false), 2)).toBe(false)
    expect(message).toContain("2 unsent comments")
    expect(await confirmReviewExit(dialog(undefined), 0)).toBe(false)
    expect(await confirmReviewExit(dialog(true), 1)).toBe(true)
    expect(message).toContain("1 unsent comment.")
  })

  test("builds a named unified patch from the review baseline and current source", () => {
    const diff = buildUnifiedDiff(startReview("# Diagram\nold\n", "# Diagram\nnew\n"), "architecture.md")

    expect(diff).toContain("--- architecture.md")
    expect(diff).toContain("+++ architecture.md")
    expect(diff).toContain("-old")
    expect(diff).toContain("+new")
  })

  test("builds an editable draft with comments and a diff without submitting anything", () => {
    const source = "$y$\n```mermaid\nflowchart LR\n```\n"
    const review = addReviewComment(
      addReviewComment(
        startReview("$x$\n```mermaid\nflowchart LR\n```\n", source),
        { ...formulaComment, range: { start: 0, end: 3, atomKind: "formula" } },
      ),
      { ...mermaidComment, range: { start: 4, end: source.length - 1, atomKind: "mermaid" } },
    )

    const draft = buildGeneralMessageDraft(review, "Please address these review notes.", "canvas.md")

    expect(draft).toContain("Please address these review notes.")
    expect(draft).toContain("## Artifact\nPath: canvas.md")
    expect(draft).toContain("- [formula 0-3] Define each variable.")
    expect(draft).toContain("$y$")
    expect(draft).toContain("- [mermaid 4-31] Show the retry path.")
    expect(draft).toContain("```mermaid\nflowchart LR\n```")
    expect(draft).toContain("-$x$")
    expect(draft).toContain("+$y$")
  })
})
