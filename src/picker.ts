import { readdirSync, statSync } from "node:fs"
import path from "node:path"

const DEFAULT_EXTENSIONS = [".md"] as const
const SKIPPED_DIRECTORIES = new Set(["node_modules"])
const TITLE_BOUNDARIES = new Set(["/", "\\", "-", "_"])

// Artifact discovery accepts either a configured array or a comma-separated
// string, and always falls back to Markdown when the value is unusable.
export function artifactExtensions(options: Readonly<Record<string, unknown>>): string[] {
  const configured = options.extensions
  const entries = typeof configured === "string" ? configured.split(",") : Array.isArray(configured) ? configured : undefined
  if (!entries) return [...DEFAULT_EXTENSIONS]
  const extensions: string[] = []
  for (const entry of entries) {
    if (typeof entry !== "string") continue
    const value = entry.trim().toLowerCase()
    if (!value) continue
    const extension = value.startsWith(".") ? value : `.${value}`
    if (!extensions.includes(extension)) extensions.push(extension)
  }
  return extensions.length ? extensions : [...DEFAULT_EXTENSIONS]
}

// Discovery walks the project tree itself: hidden directories (including .git),
// node_modules, and symlinked directories are skipped, while symlinked files
// still count as artifacts.
export function collectArtifactFiles(root: string, extensions: readonly string[]): string[] {
  const base = path.resolve(root)
  const wanted = new Set(extensions.map((extension) => extension.toLowerCase()))
  const files: string[] = []
  const read = (directory: string) => {
    try {
      return readdirSync(directory, { withFileTypes: true })
    } catch {
      return []
    }
  }
  const walk = (directory: string) => {
    for (const entry of read(directory)) {
      const entryPath = path.join(directory, entry.name)
      if (entry.isDirectory()) {
        if (entry.name.startsWith(".") || SKIPPED_DIRECTORIES.has(entry.name)) continue
        walk(entryPath)
        continue
      }
      if (entry.isSymbolicLink()) {
        let target
        try {
          target = statSync(entryPath)
        } catch {
          continue
        }
        if (!target.isFile()) continue
      } else if (!entry.isFile()) {
        continue
      }
      if (wanted.has(path.extname(entry.name).toLowerCase())) files.push(entryPath)
    }
  }
  walk(base)
  const depth = (file: string) => path.relative(base, file).split(path.sep).length
  return files.sort((left, right) => depth(left) - depth(right) || (left < right ? -1 : left > right ? 1 : 0))
}

function subsequenceScore(query: string, title: string) {
  const haystack = title.toLowerCase()
  let score = 0
  let previous = -2
  let from = 0
  for (const character of query) {
    const index = haystack.indexOf(character, from)
    if (index < 0) return undefined
    score += 2
    if (index === previous + 1) score += 4
    if (index === 0 || TITLE_BOUNDARIES.has(haystack[index - 1]!)) score += 2
    previous = index
    from = index + 1
  }
  return score
}

// Used as the picker's `search` callback: an empty query keeps the original
// discovery order, while matches rank by run length, path boundaries, and then
// by shorter titles. Equal scores keep their incoming order.
export function fuzzyFilterArtifacts<T extends { readonly title: string }>(
  query: string,
  options: readonly T[],
): readonly T[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return options
  const matches: { option: T; score: number; order: number }[] = []
  options.forEach((option, order) => {
    const score = subsequenceScore(needle, option.title)
    if (score !== undefined) matches.push({ option, score, order })
  })
  return matches
    .sort((left, right) =>
      right.score - left.score ||
      left.option.title.length - right.option.title.length ||
      left.order - right.order)
    .map((match) => match.option)
}
