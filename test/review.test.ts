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
import { scanDocument } from "../src/inline"
import { imageBox, imageMaxRows, localImageID, resolveLocalImage, standaloneImage } from "../src/images"

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
    const blocks = scanDocument(source)
    const comment = { ...formulaComment, range: { start: 0, end: source.length, atomKind: "text" as const } }

    expect(blocks.map((block) => block.type)).toEqual(["markdown", "display-math", "markdown"])
    expect(blocks.map((block) => block.source.atom)).toEqual(["text", "formula", "mermaid"])
    expect(assignCommentRails([comment], blocks.map((block) => block.source))).toEqual([
      { comment, start: 0, end: 2, column: 0 },
    ])
  })

  test("keeps standalone local Markdown images as reviewable blocks", () => {
    const source = "Before\n\n![Chart](assets/chart.webp)\n\nAfter\n"
    const blocks = scanDocument(source)

    expect(blocks.map((block) => block.type)).toEqual(["markdown", "image", "markdown"])
    expect(blocks[1]).toMatchObject({
      type: "image",
      href: "assets/chart.webp",
      alt: "Chart",
      source: { start: 8, end: 35, atom: "text" },
    })
  })

  test("parses standalone images and refuses network image sources", () => {
    expect(standaloneImage("![A chart](<assets/chart (final).png>)")).toEqual({ href: "assets/chart (final).png", alt: "A chart" })
    expect(standaloneImage("Text before ![A chart](assets/chart.png)")).toBeUndefined()
    expect(resolveLocalImage("/work/docs", "assets/chart.png")).toEqual({ path: "/work/docs/assets/chart.png" })
    expect(resolveLocalImage("/work/docs", "https://example.com/chart.png")).toEqual({ error: "Only local image paths are supported" })
  })

  test("fits portrait images within the Canvas image height limit", () => {
    expect(imageBox(1600, 900, 80, 2)).toEqual({ columns: 80, rows: 23 })
    expect(imageBox(100, 800, 80, 2)).toEqual({ columns: 6, rows: imageMaxRows })
  })

  test("changes the terminal image identity when its cell geometry changes", () => {
    const box = { columns: 40, rows: 12 }
    const before = localImageID("/work/chart.png", box, { width: 8, height: 16 })
    const after = localImageID("/work/chart.png", box, { width: 10, height: 20 })

    expect(before).not.toEqual(after)
    expect(localImageID("/work/chart.png", box, { width: 8, height: 16 })).toEqual(before)
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
