import { describe, expect, it } from "vitest"
import {
  contents,
  getContentsByCategory,
  getEventsInPeriod,
  getLatestContents,
  getOngoingContentsByCategory,
  getPlace,
  places,
} from "./data"

describe("data", () => {
  it("places / contents が読み込まれる", () => {
    expect(places.length).toBeGreaterThan(0)
    expect(contents.length).toBeGreaterThan(0)
  })

  it("getPlace はIDで取得できる", () => {
    expect(getPlace("sensoji")?.name).toBe("浅草寺")
    expect(getPlace("unknown")).toBeUndefined()
  })

  it("getLatestContents は公開日降順", () => {
    const latest = getLatestContents()
    for (let i = 1; i < latest.length; i++) {
      expect(
        latest[i - 1].published_at >= latest[i].published_at,
      ).toBe(true)
    }
  })

  it("getContentsByCategory は該当カテゴリのみ返す", () => {
    const sales = getContentsByCategory("sale")
    expect(sales.length).toBeGreaterThan(0)
    expect(sales.every((content) => content.category === "sale")).toBe(true)
  })

  it("getEventsInPeriod は期間重複イベントを返す", () => {
    const events = getEventsInPeriod("2026-09-05", "2026-09-05")
    expect(events.some((event) => event.id === "rox-autumn-sale-2026")).toBe(
      true,
    )
    expect(
      events.some((event) => event.id === "sensoji-chrysanthemum-2026"),
    ).toBe(false)
  })

  it("getOngoingContentsByCategory は開催中のみ返す", () => {
    const ongoing = getOngoingContentsByCategory(
      "sale",
      new Date("2026-09-05"),
    )
    expect(ongoing.map((content) => content.id)).toContain(
      "rox-autumn-sale-2026",
    )
  })
})
