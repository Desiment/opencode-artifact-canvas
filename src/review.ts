import { createPatch } from "diff"

export type ArtifactAtomKind = "text" | "formula" | "mermaid"

// Offsets are zero-based positions in the source captured by the review snapshot.
export type SourceRange = {
  readonly start: number
  readonly end: number
  readonly atomKind: ArtifactAtomKind
}

export type ReviewComment = {
  readonly id: string
  readonly range: SourceRange
  readonly message: string
}

export type EditSnapshot = {
  readonly baseline: string
  readonly current: string
}

export type ReviewSnapshot = EditSnapshot & {
  readonly comments: readonly ReviewComment[]
}

export type ReviewCommentUpdate = {
  readonly range?: SourceRange
  readonly message?: string
}

export type ReviewCommentRail = {
  readonly comment: ReviewComment
  readonly start: number
  readonly end: number
  readonly column: number
}

export function startReview(baseline: string, current: string): ReviewSnapshot {
  return { baseline, current, comments: [] }
}

export function addReviewComment(snapshot: ReviewSnapshot, comment: ReviewComment): ReviewSnapshot {
  return { ...snapshot, comments: [...snapshot.comments, comment] }
}

export function updateReviewComment(snapshot: ReviewSnapshot, id: string, update: ReviewCommentUpdate): ReviewSnapshot {
  const comment = snapshot.comments.find((item) => item.id === id)
  if (!comment) return snapshot
  return {
    ...snapshot,
    comments: snapshot.comments.map((item) =>
      item.id === id ? { ...item, range: update.range ?? item.range, message: update.message ?? item.message } : item,
    ),
  }
}

export function deleteReviewComment(snapshot: ReviewSnapshot, id: string): ReviewSnapshot {
  const comments = snapshot.comments.filter((comment) => comment.id !== id)
  if (comments.length === snapshot.comments.length) return snapshot
  return { ...snapshot, comments }
}

// A selection may span several Canvas blocks. Its card belongs after the block
// containing the final source offset, while the complete range stays intact for
// the review packet.
export function commentEndsInBlock(comment: ReviewComment, block: { start: number; end: number }) {
  return comment.range.end > block.start && comment.range.end <= block.end
}

export function commentOverlapsBlock(comment: ReviewComment, block: { start: number; end: number }) {
  return comment.range.start < block.end && comment.range.end > block.start
}

export function assignCommentRails(comments: readonly ReviewComment[], blocks: readonly { start: number; end: number }[]) {
  const spans = comments.flatMap((comment, order) => {
    const covered = blocks.flatMap((block, index) => commentOverlapsBlock(comment, block) ? [index] : [])
    if (!covered.length) return []
    return [{ comment, start: covered[0]!, end: covered.at(-1)!, order }]
  })
  const ends: number[] = []
  return spans
    .toSorted((a, b) => a.start - b.start || a.order - b.order)
    .map((span) => {
      const column = ends.findIndex((end) => end < span.start)
      if (column < 0) {
        ends.push(span.end)
        return { ...span, column: ends.length - 1 }
      }
      ends[column] = span.end
      return { ...span, column }
    })
    .toSorted((a, b) => a.order - b.order)
    .map(({ order: _, ...rail }) => rail)
}

export function buildUnifiedDiff(snapshot: EditSnapshot, filename = "artifact.md") {
  return createPatch(filename, snapshot.baseline, snapshot.current, "", "", { context: 3 })
}

export function buildGeneralMessageDraft(snapshot: ReviewSnapshot, generalMessage: string, filePath = "artifact.md") {
  const comments = snapshot.comments.length === 0
    ? "- No inline comments."
    : snapshot.comments
        .map((comment) => {
          const source = snapshot.current.slice(comment.range.start, comment.range.end)
          return [
            `- [${comment.range.atomKind} ${comment.range.start}-${comment.range.end}] ${comment.message}`,
            "```markdown",
            source,
            "```",
          ].join("\n")
        })
        .join("\n")
  return [
    generalMessage.trim() || "Review the following Artifact Canvas update.",
    "",
    "## Artifact",
    `Path: ${filePath}`,
    "",
    "## Comments",
    comments,
    "",
    "## Diff",
    "```diff",
    buildUnifiedDiff(snapshot, filePath).trimEnd(),
    "```",
  ].join("\n")
}
