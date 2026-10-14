import { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/json-ld"

export const dynamic = "force-static"

const robots = (): MetadataRoute.Robots => ({
  rules: { userAgent: "*", allow: "/" },
  sitemap: [`${SITE_URL}/sitemap.xml`, `${SITE_URL}/news-sitemap.xml`],
})

export default robots
