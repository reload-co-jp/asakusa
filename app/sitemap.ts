import { MetadataRoute } from "next"
import {
  contents,
  getArchiveMonths,
  getCategoryCount,
  places,
} from "@/lib/data"
import { SITE_URL } from "@/lib/json-ld"
import { CATEGORIES, Category } from "@/lib/types"

export const dynamic = "force-static"

// 日付ページはビルド毎に内容が変わるため、ビルド時刻をlastModifiedに使う
const buildTime = new Date().toISOString()

const sitemap = (): MetadataRoute.Sitemap => [
  {
    url: `${SITE_URL}/`,
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
    url: `${SITE_URL}${path}`,
    lastModified: buildTime,
    changeFrequency: "daily" as const,
    priority: 0.8,
  })),
  ...getArchiveMonths().map(({ year, month }) => ({
    url: `${SITE_URL}/events/${year}/${month}/`,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  })),
  // 記事0件のカテゴリはnoindexのため除外
  ...(Object.keys(CATEGORIES) as Category[])
    .filter((category) => getCategoryCount(category) > 0)
    .map((category) => ({
      url: `${SITE_URL}/category/${category}/`,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  { url: `${SITE_URL}/place/`, changeFrequency: "weekly", priority: 0.7 },
  ...places.map((place) => ({
    url: `${SITE_URL}/place/${place.id}/`,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  })),
  ...contents.map((content) => ({
    url: `${SITE_URL}/content/${content.id}/`,
    lastModified: content.published_at,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  })),
]

export default sitemap
