// ビルド環境(GitHub ActionsはUTC)に依存せず、常に日本時間(JST)で日付を扱う
const JST_OFFSET_MS = 9 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000
const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"]

// "YYYY-MM-DD"をUTC 0時のDateとして扱い、曜日・日付計算をタイムゾーン非依存にする
const parse = (date: string): Date => new Date(`${date}T00:00:00Z`)

const format = (date: Date): string => date.toISOString().slice(0, 10)

export const jstDateString = (now = new Date()): string =>
  format(new Date(now.getTime() + JST_OFFSET_MS))

export const addDays = (date: string, days: number): string =>
  format(new Date(parse(date).getTime() + days * DAY_MS))

export const weekday = (date: string): number => parse(date).getUTCDay()

export type Period = { from: string; to: string }

export const todayPeriod = (now = new Date()): Period => {
  const today = jstDateString(now)
  return { from: today, to: today }
}

// 今週 = 今日〜今週日曜(月曜始まり)
export const thisWeekPeriod = (now = new Date()): Period => {
  const today = jstDateString(now)
  return { from: today, to: addDays(today, (7 - weekday(today)) % 7) }
}

// 来週 = 次の月曜〜日曜
export const nextWeekPeriod = (now = new Date()): Period => {
  const today = jstDateString(now)
  const monday = addDays(today, ((7 - weekday(today)) % 7) + 1)
  return { from: monday, to: addDays(monday, 6) }
}

// 今週末 = 次の土日。土曜は当日から、日曜は当日のみ
export const weekendPeriod = (now = new Date()): Period => {
  const today = jstDateString(now)
  const day = weekday(today)
  if (day === 0) return { from: today, to: today }
  const saturday = addDays(today, 6 - day)
  return { from: saturday, to: addDays(saturday, 1) }
}

// 今月 = 今日〜月末
export const thisMonthPeriod = (now = new Date()): Period => {
  const today = jstDateString(now)
  const [year, month] = today.split("-").map(Number)
  const lastDay = new Date(Date.UTC(year, month, 0))
  return { from: today, to: format(lastDay) }
}

export const formatDate = (date: string): string => {
  const [year, month, day] = date.split("-")
  return `${year}年${Number(month)}月${Number(day)}日`
}

export const formatDateWithWeekday = (date: string): string =>
  `${formatDate(date)}（${WEEKDAYS[weekday(date)]}）`

// 同年同月の範囲は「2026年9月26日・27日」「2026年9月22日〜28日」のように短縮
export const formatPeriod = ({ from, to }: Period): string => {
  if (from === to) return formatDate(from)
  const [fromYear, fromMonth] = from.split("-")
  const [toYear, toMonth, toDay] = to.split("-")
  const separator = addDays(from, 1) === to ? "・" : "〜"
  if (fromYear === toYear && fromMonth === toMonth)
    return `${formatDate(from)}${separator}${Number(toDay)}日`
  return `${formatDate(from)}${separator}${formatDate(to)}`
}
