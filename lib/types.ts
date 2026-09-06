export const CATEGORIES = {
  event: "イベント",
  festival: "祭り・季節行事",
  performance: "公演・演芸",
  new_opening: "新規オープン",
  closing: "閉店",
  renewal: "リニューアル",
  sale: "セール",
  campaign: "キャンペーン",
  popup: "POP UP",
  new_product: "新商品",
  exhibition: "展示会",
  facility_news: "施設ニュース",
  local_news: "地域ニュース",
} as const

export type Category = keyof typeof CATEGORIES

export const PLACE_TYPES = {
  store: "店舗",
  facility: "施設",
  temple: "寺院",
  shrine: "神社",
  museum: "博物館",
  theater: "劇場",
  park: "公園",
  tourist_spot: "観光スポット",
  other: "その他",
} as const

export type PlaceType = keyof typeof PLACE_TYPES

export type Place = {
  id: string
  name: string
  type: PlaceType
  description: string
  address: string
  latitude: number | null
  longitude: number | null
  opening_hours: string | null
  phone: string | null
  url: string | null
  image_url: string | null
  area: string
  source_id: string | null
  source_url: string | null
}

export type ContentType = "event" | "news"

export type Content = {
  id: number
  type: ContentType
  title: string
  summary: string
  body: string
  category: Category
  published_at: string
  start_at: string | null
  end_at: string | null
  place_id: string | null
  source_id: string | null
  source_url: string | null
  image_url: string | null
}

export type SourceType =
  | "government"
  | "official"
  | "press_release"
  | "event_platform"
  | "gourmet_site"
  | "sns"
  | "web_media"

export type Source = {
  id: string
  name: string
  url: string
  source_type: SourceType
  priority: number
}
