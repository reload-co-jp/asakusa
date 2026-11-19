import DOMPurify from "isomorphic-dompurify"
import { Marked, type TokenizerAndRendererExtension } from "marked"

// CommonMarkの強調ルールでは「で**「…」**が」のように**の前後が
// 句読点・括弧と文字の組み合わせになると太字と判定されず、**がそのまま表示される。
// 日本語・中国語の本文で頻出するため、**…**は前後の文字を問わず太字として扱う
const cjkStrong: TokenizerAndRendererExtension = {
  name: "cjkStrong",
  level: "inline",
  start: (src) => src.indexOf("**"),
  tokenizer(src) {
    const match = /^\*\*(?!\s)([^*\n]*?[^\s*])\*\*/.exec(src)
    if (!match) return undefined
    return {
      type: "cjkStrong",
      raw: match[0],
      tokens: this.lexer.inlineTokens(match[1]),
    }
  },
  renderer(token) {
    return `<strong>${this.parser.parseInline(token.tokens ?? [])}</strong>`
  },
}

const marked = new Marked({ breaks: true, extensions: [cjkStrong] })

// 記事本文(Markdown)をサニタイズ済みHTMLにする
export const renderMarkdown = (markdown: string) =>
  DOMPurify.sanitize(marked.parse(markdown, { async: false }))
