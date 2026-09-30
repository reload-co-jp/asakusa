import { Metadata } from "next"
import Link from "next/link"
import { FC } from "react"
import { Breadcrumbs } from "@/components/elements/breadcrumbs"
import { Section } from "@/components/elements/content"
import { getPlaceContents, localizePlace, places } from "@/lib/data"
import { alternates, getDictionary, localePath } from "@/lib/i18n"

export const generateMetadata = async (): Promise<Metadata> => {
  const { locale, t } = await getDictionary()
  const title = t.place.listTitle
  const description = t.place.listDescription(places.length)
  return {
    title,
    description,
    alternates: alternates(locale, "/place/"),
    openGraph: {
      title,
      description,
      type: "website",
      url: localePath(locale, "/place/"),
    },
  }
}

const Page: FC = async () => {
  const { locale, t } = await getDictionary()
  return (
    <>
      <Breadcrumbs items={[{ name: t.nav.places, href: "/place/" }]} />
      <Section
        description={t.place.listLead}
        level={1}
        title={t.place.listHeading}
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
          {places.map((original) => {
            const place = localizePlace(original, locale)
            const { ongoing, upcoming } = getPlaceContents(place.id)
            const count = ongoing.length + upcoming.length
            return (
              <li
                key={place.id}
                style={{ background: "#fff", padding: "1.25rem 1.5rem" }}
              >
                <span style={{ color: "var(--muted)", fontSize: ".72rem" }}>
                  {t.placeTypes[place.type]} / {place.area}
                </span>
                <h2 style={{ fontSize: "1.02rem", margin: ".4rem 0" }}>
                  <Link
                    href={localePath(locale, `/place/${place.id}/`)}
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
                    {t.place.eventCount(count)}
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      </Section>
    </>
  )
}

export default Page
