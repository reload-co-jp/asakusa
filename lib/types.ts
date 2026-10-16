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

// カテゴリページのtitle/H1。検索意図(例: 浅草 新店舗)に合わせる
export const CATEGORY_TITLES: Record<Category, string> = {
  event: "浅草のイベント・体験情報",
  festival: "浅草の祭り・伝統行事・季節行事",
  performance: "浅草の公演・演芸・落語情報",
  theater: "浅草の演劇・舞台公演情報",
  concert: "浅草のコンサート・ライブ情報",
  new_opening: "浅草の新店舗・新規オープン情報",
  closing: "浅草の閉店情報",
  renewal: "浅草のリニューアル情報",
  sale: "浅草のセール情報",
  campaign: "浅草のキャンペーン情報",
  popup: "浅草のPOP UP・期間限定ショップ情報",
  new_product: "浅草の新商品・限定商品情報",
  exhibition: "浅草の展示・展覧会情報",
  facility_news: "浅草の施設ニュース",
  local_news: "浅草の地域ニュース",
}

// パンくずで「イベント」配下に置くカテゴリ
export const EVENT_CATEGORIES: Category[] = [
  "event",
  "festival",
  "performance",
  "theater",
  "concert",
  "exhibition",
  "popup",
]

// 記事のエリアタグ。雷門・仲見世・六区・花川戸・西浅草・千束などは「浅草」に含める
export const AREAS = {
  asakusa: "浅草",
  kuramae: "蔵前",
  tawaramachi: "田原町",
  inaricho: "稲荷町",
  asakusabashi: "浅草橋",
  honjoazumabashi: "本所吾妻橋",
  oshiage: "押上",
} as const

export type Area = keyof typeof AREAS

// 検索ニーズ別のテーマページ(例: 浅草 無料 イベント)。記事の tags で判定(scripts/lib/themes.mjs に判定基準)
export const THEMES = {
  free: "無料イベント",
  kids: "子連れ・親子",
  workshop: "体験・ワークショップ",
  night: "夜・ライトアップ",
} as const

export type Theme = keyof typeof THEMES

export const PLACE_TYPES = {
  store: "店舗",
  facility: "施設",
  temple: "寺院",
  shrine: "神社",
  museum: "博物館",
  theater: "劇場",
  park: "公園",
  tourist_spot: "観光スポット",
  restaurant: "飲食店",
  other: "その他",
} as const

export type PlaceType = keyof typeof PLACE_TYPES

// グルメスポット(飲食店・食品店)のジャンル
export const GOURMET_GENRES = {
  sukiyaki: "すき焼・牛鍋",
  tempura: "天ぷら・天丼",
  soba: "蕎麦",
  washoku: "和食・寿司・うなぎ",
  ramen: "ラーメン",
  yoshoku: "洋食",
  okonomiyaki: "お好み焼・焼きそば",
  sweets: "甘味・和菓子",
  cafe: "喫茶・カフェ・パン",
  bar: "居酒屋・バー",
} as const

export type GourmetGenre = keyof typeof GOURMET_GENRES

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
  genre?: GourmetGenre
  area: string
  source_id: string | null
  source_url: string | null
  // 掲載情報(住所・営業時間等)を最後に確認した日(YYYY-MM-DD)
  updated_at: string
}

export type ContentType = "event" | "news"

export type Content = {
  id: number
  type: ContentType
  title: string
  summary: string
  body: string
  category: Category
  area: Area
  // テーマページ(/theme/〇〇/)用のタグ。scripts/tag-contents.mjs・fetch-contents.mjs が付与
  tags?: Theme[]
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
