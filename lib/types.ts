export const CATEGORIES = {
  event: "イベント",
  festival: "祭り・季節行事",
  performance: "公演・演芸",
  theater: "演劇",
  concert: "コンサート",
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

export const CATEGORY_DESCRIPTIONS: Record<Category, string> = {
  event: "浅草エリアで開催されるイベント情報をまとめてお届け",
  festival: "浅草の祭り・季節行事の開催情報をまとめてお届け",
  performance: "浅草の公演・演芸情報をまとめてお届け",
  theater: "浅草の演劇公演情報をまとめてお届け",
  concert: "浅草エリアのコンサート情報をまとめてお届け",
  new_opening: "浅草エリアの新規オープン店舗・施設情報をまとめてお届け",
  closing: "浅草エリアの閉店情報をまとめてお届け",
  renewal: "浅草エリアのリニューアル情報をまとめてお届け",
  sale: "浅草エリアで開催中のセール情報をまとめてお届け",
  campaign: "浅草エリアのキャンペーン情報をまとめてお届け",
  popup: "浅草エリアのPOP UP出店情報をまとめてお届け",
  new_product: "浅草エリアの新商品情報をまとめてお届け",
  exhibition: "浅草エリアの展示会情報をまとめてお届け",
  facility_news: "浅草エリアの施設ニュースをまとめてお届け",
  local_news: "浅草エリアの地域ニュースをまとめてお届け",
}

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
  // 同一記事が複数回クロールされ内容統合された場合に追記される、source_url以外の出典URL一覧
  source_urls?: string[]
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
