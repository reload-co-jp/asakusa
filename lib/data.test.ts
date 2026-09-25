import { describe, expect, it } from "vitest"
import {
  contents,
  getArchiveMonths,
  ARCHIVE_MIN_EVENTS,
  getContentsByCategory,
  getEventsInPeriod,
  getUpcomingDaysEvents,
  getMonthEvents,
  getPlaceContents,
  getRelatedContents,
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
      expect(latest[i - 1].published_at >= latest[i].published_at).toBe(true)
    }
  })

  it("getContentsByCategory は該当カテゴリのみ返す", () => {
    const sales = getContentsByCategory("sale")
    expect(sales.length).toBeGreaterThan(0)
    expect(sales.every((content) => content.category === "sale")).toBe(true)
  })

  it("getEventsInPeriod は期間重複イベントを返す", () => {
    const events = getEventsInPeriod("2026-09-05", "2026-09-05")
    expect(events.some((event) => event.id === 3)).toBe(true)
    expect(events.some((event) => event.id === 4)).toBe(false)
  })

  it("getUpcomingDaysEvents は今日〜明後日の期間と重複するイベントを返す", () => {
    const now = new Date("2026-09-03T12:00:00+09:00")
    const expected = getEventsInPeriod("2026-09-03", "2026-09-05")
    expect(getUpcomingDaysEvents(now)).toEqual(expected)
  })

  it("getOngoingContentsByCategory は開催中のみ返す", () => {
    const ongoing = getOngoingContentsByCategory(
      "sale",
      new Date("2026-09-05T12:00:00+09:00")
    )
    expect(ongoing.map((content) => content.id)).toContain(3)
  })

  it("getPlaceContents は開催中・今後・その他に重複なく分類", () => {
    const now = new Date("2026-09-25T12:00:00+09:00")
    const { ongoing, upcoming, others } = getPlaceContents("sensoji", now)
    const ids = [...ongoing, ...upcoming, ...others].map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.length).toBe(
      contents.filter((c) => c.place_id === "sensoji").length
    )
    expect(upcoming.every((c) => (c.start_at ?? "") > "2026-09-25")).toBe(true)
  })

  it("getRelatedContents は自分を含まず上限以内", () => {
    const target = contents.find((c) => c.place_id === "sensoji")!
    const related = getRelatedContents(target, 6)
    expect(related.length).toBeLessThanOrEqual(6)
    expect(related.some((c) => c.id === target.id)).toBe(false)
    expect(related[0]?.place_id).toBe("sensoji")
  })

  it("getArchiveMonths はしきい値以上の月のみ", () => {
    for (const { year, month } of getArchiveMonths()) {
      expect(getMonthEvents(year, month).length).toBeGreaterThanOrEqual(
        ARCHIVE_MIN_EVENTS
      )
    }
  })
})
