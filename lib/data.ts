import placesJson from "@/data/places.json"
import contentsJson from "@/data/contents.json"
import sourcesJson from "@/data/sources.json"
import { AREAS } from "./types"
import type { Area, Category, Content, Place, Source } from "./types"

export const places = placesJson as Place[]
export const contents = contentsJson as Content[]
export const sources = sourcesJson as Source[]

export const getPlace = (id: string): Place | undefined =>
  places.find((place) => place.id === id)

export const getContent = (id: string): Content | undefined =>
  contents.find((content) => content.id === id)

export const getSource = (id: string): Source | undefined =>
  sources.find((source) => source.id === id)

const sortByLatest = (items: Content[]): Content[] =>
  [...items].sort((a, b) => b.published_at.localeCompare(a.published_at))

export const getLatestContents = (limit?: number): Content[] => {
  const sorted = sortByLatest(contents)
  return limit ? sorted.slice(0, limit) : sorted
}

export const getContentsByCategory = (category: Category): Content[] =>
  sortByLatest(contents.filter((content) => content.category === category))

export const getContentsByPlace = (placeId: string): Content[] =>
  sortByLatest(contents.filter((content) => content.place_id === placeId))

export const getArea = (slug: string): Area | undefined =>
  AREAS.find((area) => area.slug === slug)

export const getPlacesByArea = (areaName: string): Place[] =>
  places.filter((place) => place.area === areaName)

export const getContentsByArea = (areaName: string): Content[] => {
  const placeIds = new Set(getPlacesByArea(areaName).map((place) => place.id))
  return sortByLatest(
    contents.filter(
      (content) => content.place_id && placeIds.has(content.place_id),
    ),
  )
}

const toDateString = (date: Date): string => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

const isInPeriod = (content: Content, from: string, to: string): boolean => {
  if (!content.start_at) return false
  const start = content.start_at
  const end = content.end_at ?? content.start_at
  return start <= to && end >= from
}

export const getEventsInPeriod = (from: string, to: string): Content[] =>
  contents
    .filter((content) => content.type === "event" && isInPeriod(content, from, to))
    .sort((a, b) => (a.start_at ?? "").localeCompare(b.start_at ?? ""))

export const getTodayEvents = (today = new Date()): Content[] => {
  const date = toDateString(today)
  return getEventsInPeriod(date, date)
}

export const getThisWeekEvents = (today = new Date()): Content[] => {
  const from = toDateString(today)
  const end = new Date(today)
  end.setDate(end.getDate() + 6)
  return getEventsInPeriod(from, toDateString(end))
}

export const getWeekendEvents = (today = new Date()): Content[] => {
  const saturday = new Date(today)
  saturday.setDate(saturday.getDate() + ((6 - saturday.getDay() + 7) % 7))
  const sunday = new Date(saturday)
  sunday.setDate(sunday.getDate() + 1)
  return getEventsInPeriod(toDateString(saturday), toDateString(sunday))
}

export const getOngoingContentsByCategory = (
  category: Category,
  today = new Date(),
): Content[] => {
  const date = toDateString(today)
  return contents
    .filter(
      (content) =>
        content.category === category && isInPeriod(content, date, date),
    )
    .sort((a, b) => (a.end_at ?? "").localeCompare(b.end_at ?? ""))
}
