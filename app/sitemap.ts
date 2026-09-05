import { MetadataRoute } from "next"
import { contents, places } from "@/lib/data"
import { SITE_URL } from "@/lib/json-ld"
import { AREAS, CATEGORIES } from "@/lib/types"

export const dynamic = "force-static"

const sitemap = (): MetadataRoute.Sitemap => [
  { url: `${SITE_URL}/`, changeFrequency: "hourly", priority: 1 },
  { url: `${SITE_URL}/area/`, changeFrequency: "monthly", priority: 0.5 },
  ...Object.keys(CATEGORIES).map((category) => ({
    url: `${SITE_URL}/category/${category}/`,
    changeFrequency: "daily" as const,
    priority: 0.7,
  })),
  ...AREAS.map((area) => ({
    url: `${SITE_URL}/area/${area.slug}/`,
    changeFrequency: "daily" as const,
    priority: 0.7,
  })),
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
