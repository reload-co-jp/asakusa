import { Metadata } from "next"
import Link from "next/link"
import { FC } from "react"
import { Breadcrumbs } from "@/components/elements/breadcrumbs"
import { Section } from "@/components/elements/content"
import { getContentsByArea } from "@/lib/data"
import { alternates, getDictionary, localePath } from "@/lib/i18n"
import { Area, AREAS } from "@/lib/types"

export const generateMetadata = async (): Promise<Metadata> => {
  const { locale, t } = await getDictionary()
  const title = `${t.area.listTitle}｜${t.siteName}`
  const description = t.area.listDescription
  return {
    title,
    description,
    alternates: alternates(locale, "/area/"),
    openGraph: {
      title,
      description,
      type: "website",
      url: localePath(locale, "/area/"),
    },
  }
}

const Page: FC = async () => {
  const { locale, t } = await getDictionary()
  // 記事0件のエリアはnoindexのためリンクしない
  const areas = (Object.keys(AREAS) as Area[])
    .map((area) => ({ area, contents: getContentsByArea(area) }))
    .filter(({ contents }) => contents.length > 0)
  return (
    <>
      <Breadcrumbs items={[{ name: t.nav.areas, href: "/area/" }]} />
      <Section
        description={t.area.listDescription}
        level={1}
        title={t.area.listHeading}
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
          {areas.map(({ area, contents }) => (
            <li
              key={area}
              style={{ background: "var(--surface)", padding: "1.25rem 1.5rem" }}
            >
              <h2 style={{ fontSize: "1.02rem", margin: "0 0 .4rem" }}>
                <Link
                  href={localePath(locale, `/area/${area}/`)}
                  style={{ color: "var(--ink)", textDecoration: "none" }}
                >
                  {t.area.title(t.areas[area])}
                </Link>
              </h2>
              <p
                style={{
                  color: "var(--ink-soft)",
                  fontSize: ".85rem",
                  margin: 0,
                }}
              >
                {t.area.description(t.areas[area], contents.length)}
              </p>
            </li>
          ))}
        </ul>
      </Section>
    </>
  )
}

export default Page
