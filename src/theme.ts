import type { Plugin } from "@opencode/plugin/tui"
import type { Theme } from "opentui-markdown-render"

// Artifact Canvas follows the active OpenCode theme while using the renderer's
// smaller, stable semantic theme contract.
export function rendererTheme(context: Pick<Plugin.Context, "theme" | "themeMode">): Theme {
  const source = context.theme
  const markdown = source.markdown
  const syntax = source.syntax
  const accent = source.text.action.primary.focused
  const headingLevels: Theme["markdown"]["headingLevels"] = [
    markdown.heading,
    markdown.heading,
    markdown.heading,
    markdown.heading,
    markdown.heading,
    markdown.heading,
  ]
  return {
    mode: context.themeMode,
    accent,
    categorical: source.categorical.map((hue: (typeof source.categorical)[number]) => hue[context.themeMode === "dark" ? 300 : 700]),
    text: {
      base: source.text.base,
      muted: source.text.muted,
      feedback: {
        error: source.text.feedback.error.base,
        warning: source.text.feedback.warning.base,
        success: source.text.feedback.success.base,
        info: source.text.feedback.info.base,
      },
      action: { primary: { focused: accent } },
    },
    background: { base: source.background.base },
    border: { base: source.border.base },
    frame: { border: source.border.base, title: source.text.muted },
    markdown: {
      text: markdown.text,
      heading: markdown.heading,
      headingLevels,
      link: markdown.link,
      linkText: markdown.linkText,
      code: markdown.code,
      blockQuote: markdown.blockQuote,
      emphasis: markdown.emphasis,
      strong: markdown.strong,
      horizontalRule: markdown.horizontalRule,
      listItem: markdown.listItem,
      listEnumeration: markdown.listEnumeration,
      image: markdown.image,
      imageText: markdown.imageText,
      codeBlock: markdown.codeBlock,
    },
    syntax: {
      comment: syntax.comment,
      keyword: syntax.keyword,
      function: syntax.function,
      variable: syntax.variable,
      string: syntax.string,
      number: syntax.number,
      type: syntax.type,
      operator: syntax.operator,
      punctuation: syntax.punctuation,
    },
    diff: {
      text: {
        added: source.diff.text.added,
        removed: source.diff.text.removed,
        context: source.diff.text.context,
      },
      background: {
        added: source.diff.background.added,
        removed: source.diff.background.removed,
        context: source.diff.background.context,
      },
    },
  }
}
