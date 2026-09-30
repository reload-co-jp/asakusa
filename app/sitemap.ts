import { MetadataRoute } from "next"
import {
  contents,
  getArchiveMonths,
  getCategoryCount,
  places,
} from "@/lib/data"
import { HTML_LANG, LOCALES, localePath } from "@/lib/i18n-config"
import { SITE_URL } from "@/lib/json-ld"
import { CATEGORIES, Category } from "@/lib/types"

export const dynamic = "force-static"

// 日付ページはビルド毎に内容が変わるため、ビルド時刻をlastModifiedに使う
const buildTime = new Date().toISOString()

// url は日本語版のパスで書き、各言語版(hreflang付き)に展開する
const pages = (): MetadataRoute.Sitemap => [
  {
    url: `/`,
    lastModified: buildTime,
    changeFrequency: "daily",
    priority: 1,
  },
  ...[
    "/events/",
    "/today/",
    "/this-week/",
    "/weekend/",
    "/next-week/",
    "/this-month/",
  ].map((path) => ({
    url: `${path}`,
    lastModified: buildTime,
    changeFrequency: "daily" as const,
    priority: 0.8,
  })),
  ...getArchiveMonths().map(({ year, month }) => ({
    url: `/events/${year}/${month}/`,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  })),
  // 記事0件のカテゴリはnoindexのため除外
  ...(Object.keys(CATEGORIES) as Category[])
    .filter((category) => getCategoryCount(category) > 0)
    .map((category) => ({
      url: `/category/${category}/`,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  { url: "/place/", changeFrequency: "weekly", priority: 0.7 },
  ...places.map((place) => ({
    url: `/place/${place.id}/`,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  })),
  ...contents.map((content) => ({
    url: `/content/${content.id}/`,
    lastModified: content.published_at,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  })),
]

const sitemap = (): MetadataRoute.Sitemap =>
  pages().flatMap((page) =>
    LOCALES.map((locale) => ({
      ...page,
      url: `${SITE_URL}${localePath(locale, page.url)}`,
      alternates: {
        languages: Object.fromEntries(
          LOCALES.map((l) => [
            HTML_LANG[l],
            `${SITE_URL}${localePath(l, page.url)}`,
          ])
        ),
      },
    }))
  )

export default sitemap
