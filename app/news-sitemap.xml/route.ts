import { contents } from "@/lib/data"
import { addDays, jstDateString } from "@/lib/date"
import { SITE_URL } from "@/lib/json-ld"

export const dynamic = "force-static"

const escapeXml = (s: string): string =>
  s.replace(
    /[<>&'"]/g,
    (c) =>
      ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[
        c
      ]!
  )

// Google News サイトマップ。対象は直近2日以内に公開したニュース記事のみ
// https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap
export const GET = () => {
  const since = addDays(jstDateString(), -2)
  const urls = contents
    .filter((c) => c.type === "news" && c.published_at >= since)
    .map(
      (c) => `<url>
<loc>${SITE_URL}/content/${c.id}/</loc>
<news:news>
<news:publication><news:name>浅草ライブ</news:name><news:language>ja</news:language></news:publication>
<news:publication_date>${c.published_at}</news:publication_date>
<news:title>${escapeXml(c.title)}</news:title>
</news:news>
</url>`
    )
    .join("\n")
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>`,
    { headers: { "Content-Type": "application/xml" } }
  )
}
