import { afterEach, describe, expect, test } from "bun:test"
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { artifactExtensions, collectArtifactFiles, fuzzyFilterArtifacts } from "../src/picker"

const fixtures: string[] = []

function fixtureTree() {
  const root = mkdtempSync(path.join(tmpdir(), "canvas-picker-"))
  fixtures.push(root)
  const write = (relative: string) => {
    const file = path.join(root, relative)
    mkdirSync(path.dirname(file), { recursive: true })
    writeFileSync(file, "")
  }
  write("README.md")
  write(".hidden.md")
  write("guide.mdx")
  write("notes/deep.md")
  write("notes/deeper/nested.md")
  write(".git/config.md")
  write("node_modules/pkg/index.md")
  write("assets/chart.png")
  return root
}

afterEach(() => {
  while (fixtures.length) rmSync(fixtures.pop()!, { recursive: true, force: true })
})

describe("artifact canvas extension configuration", () => {
  test("defaults to Markdown when no extensions are configured", () => {
    expect(artifactExtensions({})).toEqual([".md"])
  })

  test("normalizes an array of extensions and drops junk", () => {
    expect(artifactExtensions({ extensions: [" MD ", ".MDX", "md", "", 7, null, ".txt"] })).toEqual([".md", ".mdx", ".txt"])
  })

  test("accepts a single comma-separated string", () => {
    expect(artifactExtensions({ extensions: "md, .MDX ,, txt" })).toEqual([".md", ".mdx", ".txt"])
  })

  test("falls back to Markdown for malformed or empty values", () => {
    expect(artifactExtensions({ extensions: 42 })).toEqual([".md"])
    expect(artifactExtensions({ extensions: [] })).toEqual([".md"])
    expect(artifactExtensions({ extensions: ["", "   "] })).toEqual([".md"])
    expect(artifactExtensions({ extensions: [".mdx"] })).toEqual([".mdx"])
  })

  test("falls back to Markdown for separator-only values but keeps a lone dot", () => {
    expect(artifactExtensions({ extensions: ",," })).toEqual([".md"])
    // A lone "." is a syntactically valid extension, so normalization keeps it.
    expect(artifactExtensions({ extensions: ["", "."] })).toEqual(["."])
  })
})

describe("artifact canvas file discovery", () => {
  test("finds nested artifacts in depth then name order and skips hidden and dependency directories", () => {
    const root = fixtureTree()
    expect(collectArtifactFiles(root, [".md"])).toEqual([
      path.join(root, ".hidden.md"),
      path.join(root, "README.md"),
      path.join(root, "notes/deep.md"),
      path.join(root, "notes/deeper/nested.md"),
    ])
  })

  test("matches only the configured extensions, case-insensitively", () => {
    const root = fixtureTree()
    expect(collectArtifactFiles(root, [".mdx"])).toEqual([path.join(root, "guide.mdx")])
    expect(collectArtifactFiles(root, [".MDX"])).toEqual([path.join(root, "guide.mdx")])
  })

  test("includes symlinked files but skips symlinked directories and broken links", () => {
    const root = fixtureTree()
    try {
      symlinkSync("notes/deep.md", path.join(root, "link.md"))
      symlinkSync("notes", path.join(root, "linked-dir"))
      symlinkSync("missing.md", path.join(root, "broken.md"))
    } catch {
      // Some filesystems disallow symlinks; the walker behavior is covered by the other assertions.
      return
    }
    const files = collectArtifactFiles(root, [".md"])
    expect(files).toContain(path.join(root, "link.md"))
    expect(files).not.toContain(path.join(root, "linked-dir/deep.md"))
    expect(files).not.toContain(path.join(root, "broken.md"))
  })

  test("returns no files for a missing root", () => {
    expect(collectArtifactFiles(path.join(tmpdir(), `canvas-picker-missing-${crypto.randomUUID()}`), [".md"])).toEqual([])
  })

  test("finds artifacts through a root directory that is itself a symlink", () => {
    const root = fixtureTree()
    const link = path.join(tmpdir(), `canvas-picker-root-${crypto.randomUUID()}`)
    try {
      symlinkSync(root, link)
    } catch {
      return
    }
    fixtures.push(link)
    expect(collectArtifactFiles(link, [".md"])).toEqual([
      path.join(link, ".hidden.md"),
      path.join(link, "README.md"),
      path.join(link, "notes/deep.md"),
      path.join(link, "notes/deeper/nested.md"),
    ])
  })

  test("does not follow a symlink cycle and yields no duplicates", () => {
    const root = fixtureTree()
    try {
      symlinkSync(root, path.join(root, "notes/cycle"))
    } catch {
      return
    }
    const files = collectArtifactFiles(root, [".md"])
    expect(files).toEqual([
      path.join(root, ".hidden.md"),
      path.join(root, "README.md"),
      path.join(root, "notes/deep.md"),
      path.join(root, "notes/deeper/nested.md"),
    ])
    expect(new Set(files).size).toBe(files.length)
  })

  test("traverses deeply nested directories", () => {
    const root = fixtureTree()
    const levels = Array.from({ length: 60 }, (_, index) => `level${index}`)
    const deep = path.join(root, ...levels, "deep.md")
    mkdirSync(path.dirname(deep), { recursive: true })
    writeFileSync(deep, "")
    expect(collectArtifactFiles(root, [".md"])).toContain(deep)
  })
})

describe("artifact canvas picker search", () => {
  const options = [
    { title: "docs/guides/readme.md", value: "nested" },
    { title: "README.md", value: "root" },
  ]

  test("returns every option unchanged for an empty query", () => {
    expect(fuzzyFilterArtifacts("", options)).toBe(options)
    expect(fuzzyFilterArtifacts("   ", options)).toBe(options)
  })

  test("matches case-insensitive subsequences and drops non-matches", () => {
    const names = [{ title: "README.md", value: "readme" }, { title: "notes.txt", value: "notes" }]
    expect(fuzzyFilterArtifacts("RDM", names)).toEqual([names[0]!])
    expect(fuzzyFilterArtifacts("rdm", names)).toEqual([names[0]!])
    expect(fuzzyFilterArtifacts("zzz", names)).toEqual([])
  })

  test("ranks shorter paths first when scores tie", () => {
    expect(fuzzyFilterArtifacts("readme", options).map((option) => option.value)).toEqual(["root", "nested"])
  })

  test("ranks consecutive matches above scattered ones", () => {
    const scattered = [
      { title: "r-e-a-d-m-e.md", value: "scattered" },
      { title: "readme.md", value: "consecutive" },
    ]
    expect(fuzzyFilterArtifacts("readme", scattered).map((option) => option.value)).toEqual(["consecutive", "scattered"])
  })

  test("ranks matches at a title boundary above interior matches", () => {
    const boundary = [
      { title: "xnotes.md", value: "interior" },
      { title: "notes.md", value: "boundary" },
    ]
    expect(fuzzyFilterArtifacts("n", boundary).map((option) => option.value)).toEqual(["boundary", "interior"])
  })

  test("keeps the incoming order for equal scores", () => {
    const equal = [{ title: "a.md" }, { title: "b.md" }]
    expect(fuzzyFilterArtifacts("md", equal).map((option) => option.title)).toEqual(["a.md", "b.md"])
    expect(fuzzyFilterArtifacts("md", equal.toReversed()).map((option) => option.title)).toEqual(["b.md", "a.md"])
  })

  test("treats regex-special characters in the query literally", () => {
    const literal = [
      { title: "a.b.md", value: "dot" },
      { title: "axb.md", value: "any" },
      { title: "notes(a).md", value: "paren" },
      { title: "star*.md", value: "star" },
    ]
    expect(fuzzyFilterArtifacts("a.b", literal).map((option) => option.value)).toEqual(["dot"])
    expect(fuzzyFilterArtifacts("(", literal).map((option) => option.value)).toEqual(["paren"])
    expect(fuzzyFilterArtifacts("*", literal).map((option) => option.value)).toEqual(["star"])
    expect(() => fuzzyFilterArtifacts("([*+?\\", literal)).not.toThrow()
  })
})
