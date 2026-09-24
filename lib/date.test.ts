import { describe, expect, it } from "vitest"
import {
  formatPeriod,
  jstDateString,
  nextWeekPeriod,
  thisMonthPeriod,
  thisWeekPeriod,
  todayPeriod,
  weekendPeriod,
} from "./date"

// 2026-09-25は金曜日
const friday = new Date("2026-09-25T03:00:00+09:00")
const saturday = new Date("2026-09-26T12:00:00+09:00")
const sunday = new Date("2026-09-27T23:59:00+09:00")

describe("date", () => {
  it("jstDateString はUTC環境でもJSTの日付を返す", () => {
    // UTCでは9/24 15:30だがJSTでは9/25 0:30
    expect(jstDateString(new Date("2026-09-24T15:30:00Z"))).toBe("2026-09-25")
    expect(jstDateString(new Date("2026-09-24T14:59:00Z"))).toBe("2026-09-24")
  })

  it("todayPeriod", () => {
    expect(todayPeriod(friday)).toEqual({
      from: "2026-09-25",
      to: "2026-09-25",
    })
  })

  it("thisWeekPeriod は今日〜日曜", () => {
    expect(thisWeekPeriod(friday)).toEqual({
      from: "2026-09-25",
      to: "2026-09-27",
    })
    expect(thisWeekPeriod(sunday)).toEqual({
      from: "2026-09-27",
      to: "2026-09-27",
    })
  })

  it("nextWeekPeriod は次の月〜日", () => {
    expect(nextWeekPeriod(friday)).toEqual({
      from: "2026-09-28",
      to: "2026-10-04",
    })
    expect(nextWeekPeriod(sunday)).toEqual({
      from: "2026-09-28",
      to: "2026-10-04",
    })
  })

  it("weekendPeriod は次の土日", () => {
    expect(weekendPeriod(friday)).toEqual({
      from: "2026-09-26",
      to: "2026-09-27",
    })
    expect(weekendPeriod(saturday)).toEqual({
      from: "2026-09-26",
      to: "2026-09-27",
    })
    expect(weekendPeriod(sunday)).toEqual({
      from: "2026-09-27",
      to: "2026-09-27",
    })
  })

  it("thisMonthPeriod は今日〜月末", () => {
    expect(thisMonthPeriod(friday)).toEqual({
      from: "2026-09-25",
      to: "2026-09-30",
    })
    expect(thisMonthPeriod(new Date("2028-02-10T12:00:00+09:00")).to).toBe(
      "2028-02-29"
    )
  })

  it("formatPeriod", () => {
    expect(formatPeriod({ from: "2026-09-25", to: "2026-09-25" })).toBe(
      "2026年9月25日"
    )
    expect(formatPeriod({ from: "2026-09-26", to: "2026-09-27" })).toBe(
      "2026年9月26日・27日"
    )
    expect(formatPeriod({ from: "2026-09-25", to: "2026-09-30" })).toBe(
      "2026年9月25日〜30日"
    )
    expect(formatPeriod({ from: "2026-09-28", to: "2026-10-04" })).toBe(
      "2026年9月28日〜2026年10月4日"
    )
  })
})
