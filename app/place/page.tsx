import { Metadata } from "next"
import Link from "next/link"
import { FC } from "react"
import { Breadcrumbs } from "@/components/elements/breadcrumbs"
import { Section } from "@/components/elements/content"
import { getPlaceContents, places } from "@/lib/data"
import { PLACE_TYPES } from "@/lib/types"

const TITLE = "浅草の観光スポット・施設情報｜寺社・劇場・商業施設｜浅草ライブ"
const DESCRIPTION = `浅草寺・浅草神社などの寺社、浅草公会堂・浅草演芸ホールなどの劇場、浅草ROX・松屋浅草などの商業施設まで、浅草の施設${places.length}件の基本情報と開催中・今後のイベントをまとめています。`

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/place/" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: "/place/",
  },
}

const Page: FC = () => (
  <>
    <Breadcrumbs items={[{ name: "施設", href: "/place/" }]} />
    <Section
      description="施設ごとに開催中・今後のイベントや関連ニュースを掲載"
      level={1}
      title="浅草の観光スポット・施設"
    >
      <ul
        style={{
          display: "grid",
          gap: "1px",
          background: "var(--border)",
          listStyle: "none",
          margin: 0,
          padding: 0,
        }}
      >
        {places.map((place) => {
          const { ongoing, upcoming } = getPlaceContents(place.id)
          const count = ongoing.length + upcoming.length
          return (
            <li
              key={place.id}
              style={{ background: "#fff", padding: "1.25rem 1.5rem" }}
            >
              <span style={{ color: "var(--muted)", fontSize: ".72rem" }}>
                {PLACE_TYPES[place.type]} / {place.area}
              </span>
              <h2 style={{ fontSize: "1.02rem", margin: ".4rem 0" }}>
                <Link
                  href={`/place/${place.id}/`}
                  style={{ color: "var(--ink)", textDecoration: "none" }}
                >
                  {place.name}
                </Link>
              </h2>
              <p
                style={{
                  color: "var(--ink-soft)",
                  fontSize: ".85rem",
                  margin: 0,
                }}
              >
                {place.description}
              </p>
              {count > 0 && (
                <p
                  style={{
                    color: "var(--accent)",
                    fontSize: ".75rem",
                    margin: ".5rem 0 0",
                  }}
                >
                  開催中・今後のイベント {count}件
                </p>
              )}
            </li>
          )
        })}
      </ul>
    </Section>
  </>
)

export default Page
