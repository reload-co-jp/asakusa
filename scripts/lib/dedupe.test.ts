import { describe, expect, it } from "vitest"
import { findDuplicate, keyTerms } from "./dedupe.mjs"

const item = (
  id: number,
  title: string,
  extra: Record<string, unknown> = {}
) => ({
  id,
  title,
  category: "popup",
  source_id: "rox",
  published_at: "2026-11-20",
  start_at: null,
  end_at: null,
  ...extra,
})

describe("keyTerms", () => {
  it("括弧内の名称と2語以上の英字名を拾う", () => {
    expect([
      ...keyTerms("浅草ROX 1F特設会場に「Atelier de Ulala」が期間限定オープン"),
    ]).toContain("atelierdeulala")
    expect([...keyTerms("ROX Atelier de Ulala ポップアップ")]).toEqual([
      "roxatelierdeulala",
    ])
  })

  it("1語の英字名・カタカナ語は拾わない", () => {
    expect([...keyTerms("Bounceが手荷物預かりサービスを開始")]).toEqual([])
  })
})

describe("findDuplicate", () => {
  it("言い回しの違うタイトルを店名で照合する", () => {
    const existing = [
      item(658, "浅草ROX 1F特設会場に「Atelier de Ulala」が期間限定オープン", {
        start_at: "2026-11-24",
        end_at: "2026-12-08",
      }),
    ]
    const candidate = item(
      0,
      "ROX Atelier de Ulala 手描き一点物の服・雑貨ポップアップ",
      { start_at: "2026-11-24", end_at: "2026-12-08" }
    )
    expect(findDuplicate(existing, candidate, "rox")?.id).toBe(658)
  })

  it("ソース・カテゴリが違っても同じ施設名なら照合する", () => {
    const existing = [
      item(659, "相撲体験施設「浅草相撲座」オープン", {
        category: "new_opening",
        source_id: "prtimes",
      }),
    ]
    const candidate = item(0, "訪日客向け相撲体験施設「浅草相撲座」がオープン", {
      category: "local_news",
      source_id: "google-news",
    })
    expect(findDuplicate(existing, candidate, "google-news")?.id).toBe(659)
  })

  it("開始日だけ変わっても終了日が同じなら同じ催事とみなす", () => {
    const existing = [
      item(1, "「Pana Suru」期間限定ショップ", {
        start_at: "2026-11-20",
        end_at: "2026-12-08",
      }),
    ]
    const candidate = item(0, "アクセサリーの「Pana Suru」が出店", {
      start_at: "2026-11-24",
      end_at: "2026-12-08",
    })
    expect(findDuplicate(existing, candidate, "rox")?.id).toBe(1)
  })

  it("公開日が離れた同名の告知は別記事とみなす", () => {
    const existing = [
      item(183, "浅草今川焼き「月のうさぎ」和歌山初出店", {
        category: "new_opening",
        published_at: "2026-09-14",
      }),
    ]
    const candidate = item(0, "浅草今川焼き「月のうさぎ」八千代店がオープン", {
      category: "local_news",
      published_at: "2026-10-07",
    })
    expect(findDuplicate(existing, candidate, "google-news")).toBeNull()
  })

  it("多くの記事に出てくる名称では照合しない", () => {
    const existing = [1, 2, 3, 4].map((id) =>
      item(id, `「松屋浅草」催事${id}`, { category: "sale" })
    )
    const candidate = item(0, "「松屋浅草」で北海道展", {
      category: "event",
      source_id: "matsuya",
    })
    expect(findDuplicate(existing, candidate, "matsuya")).toBeNull()
  })
})
