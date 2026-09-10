import { Metadata } from "next"
import { FC } from "react"
import { ContentList, Section } from "@/components/elements/content"
import { getThisWeekEvents } from "@/lib/data"
import { jsonLdToHtml, SITE_URL } from "@/lib/json-ld"

export const dynamic = "force-static"

const TITLE = "今週の浅草イベント一覧 | 公演・演劇・コンサート・演芸・祭 | 浅草ライブ"
const DESCRIPTION =
  "浅草エリアで今週開催されるイベント・公演・演劇・コンサート・演芸・祭りの最新情報一覧"

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/this-week/" },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website" },
}

const Page: FC = () => {
  const events = getThisWeekEvents()
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: events.map((content, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${SITE_URL}/content/${content.id}/`,
    })),
  }
  return (
    <Section title="今週の浅草イベント一覧">
      <script
        dangerouslySetInnerHTML={{ __html: jsonLdToHtml(jsonLd) }}
        type="application/ld+json"
      />
      <p style={{ color: "var(--muted)", fontSize: ".85rem", margin: "-1rem 0 1.5rem" }}>
        公演・演劇・コンサート・演芸・祭りなど、今週開催のイベント情報
      </p>
      <ContentList contents={events} />
    </Section>
  )
}

export default Page
