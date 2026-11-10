import { describe, expect, it } from "vitest"
import { renderMarkdown } from "./markdown"

describe("renderMarkdown", () => {
  it("括弧・句読点に隣接する**も太字にする", () => {
    expect(renderMarkdown("で**「巨大シュトレン」**が開催")).toContain(
      "で<strong>「巨大シュトレン」</strong>が開催"
    )
    expect(renderMarkdown("、**明治31年(1898)**から")).toContain(
      "<strong>明治31年(1898)</strong>"
    )
    expect(renderMarkdown("价格**30%OFF（7折）**的")).toContain(
      "<strong>30%OFF（7折）</strong>"
    )
  })

  it("通常の太字・リンク・改行を維持する", () => {
    const html = renderMarkdown(
      "**bold** and [link](https://example.com)\n次行"
    )
    expect(html).toContain("<strong>bold</strong>")
    expect(html).toContain('<a href="https://example.com">link</a>')
    expect(html).toContain("<br>")
  })

  it("太字内のリンクを解釈する", () => {
    expect(
      renderMarkdown("**[浅草寺](https://www.senso-ji.jp/)**の行事")
    ).toContain(
      '<strong><a href="https://www.senso-ji.jp/">浅草寺</a></strong>の行事'
    )
  })

  it("scriptを除去する", () => {
    expect(renderMarkdown("<script>alert(1)</script>本文")).not.toContain(
      "<script"
    )
  })
})
