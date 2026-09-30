// Client Componentからも使うため next/root-params に依存させない
export const LOCALES = ["ja", "en", "zh"] as const
export type Locale = (typeof LOCALES)[number]
// URLプレフィックスを持つ翻訳版。日本語はプレフィックス無しのルート
export const PREFIXED_LOCALES = ["en", "zh"] as const

export const HTML_LANG: Record<Locale, string> = {
  ja: "ja",
  en: "en",
  zh: "zh-Hans",
}

export const LOCALE_NAMES: Record<Locale, string> = {
  ja: "日本語",
  en: "English",
  zh: "简体中文",
}

export const localePath = (locale: Locale, path: string): string =>
  locale === "ja" ? path : `/${locale}${path}`

// canonical + hreflang
export const alternates = (locale: Locale, path: string) => ({
  canonical: localePath(locale, path),
  languages: {
    ...Object.fromEntries(
      LOCALES.map((l) => [HTML_LANG[l], localePath(l, path)])
    ),
    "x-default": path,
  },
})
