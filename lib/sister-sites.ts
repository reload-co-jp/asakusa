// 株式会社リロードが運営する東京エリア別の姉妹サイト。
// 各サイトのフッターで相互リンクし、エリア名＋「イベント」のアンカーで各サイトのイベント一覧へ誘導する。
// 7リポジトリ（shibuya / shinjuku / asakusa / akiba / ueno / ginza / ikebukuro）で同じ内容を保つこと。
export type SisterSiteId =
  "shibuya" | "shinjuku" | "asakusa" | "akiba" | "ueno" | "ginza" | "ikebukuro"

export type SisterSite = {
  id: SisterSiteId
  name: string
  url: string
  label: { ja: string; en: string }
}

export const SISTER_SITES: readonly SisterSite[] = [
  {
    id: "shibuya",
    name: "渋谷ライブ",
    url: "https://shibuya.reload.co.jp/events/",
    label: { ja: "渋谷のイベント", en: "Shibuya Events" },
  },
  {
    id: "shinjuku",
    name: "新宿ライブ",
    url: "https://shinjuku.reload.co.jp/events/",
    label: { ja: "新宿のイベント", en: "Shinjuku Events" },
  },
  {
    id: "ikebukuro",
    name: "イケブクロLive",
    url: "https://ikebukuro.reload.co.jp/events/",
    label: { ja: "池袋のイベント", en: "Ikebukuro Events" },
  },
  {
    id: "akiba",
    name: "アキバLive",
    url: "https://akiba.reload.co.jp/events/",
    label: { ja: "秋葉原のイベント", en: "Akihabara Events" },
  },
  {
    id: "ueno",
    name: "上野ライブ",
    url: "https://ueno.reload.co.jp/events/",
    label: { ja: "上野のイベント", en: "Ueno Events" },
  },
  {
    id: "asakusa",
    name: "浅草ライブ",
    url: "https://asakusa.reload.co.jp/events/",
    label: { ja: "浅草のイベント", en: "Asakusa Events" },
  },
  {
    id: "ginza",
    name: "銀座Now",
    url: "https://ginza.reload.co.jp/events/",
    label: { ja: "銀座のイベント", en: "Ginza Events" },
  },
]

export const SISTER_SITES_HEADING = {
  ja: "東京のエリア別イベント情報",
  en: "Events in Other Tokyo Areas",
}

export const getSisterSites = (self: SisterSiteId) =>
  SISTER_SITES.filter((site) => site.id !== self)
