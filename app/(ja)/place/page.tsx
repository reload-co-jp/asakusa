import { Metadata } from "next"
import Link from "next/link"
import { FC } from "react"
import { Breadcrumbs } from "@/components/elements/breadcrumbs"
import { Section } from "@/components/elements/content"
import { PlaceList } from "@/components/elements/place-list"
import {
  getPlacesByType,
  getRestaurantsByGenre,
  places,
  placeTypes,
} from "@/lib/data"
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
        {placeTypes.map((type) => (
          <Section
            id={type}
            key={type}
            more={{
              href: localePath(locale, `/place/type/${type}/`),
              label: t.place.more(t.placeTypes[type]),
            }}
            title={t.placeTypes[type]}
          >
            {type === "restaurant" ? (
              // 件数が多いためジャンル別ページへのリンクのみ
              <ul
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: ".5rem 1rem",
                  listStyle: "none",
                  margin: 0,
                  padding: 0,
                }}
              >
                {getRestaurantsByGenre().map(([genre, items]) => (
                  <li key={genre}>
                    <Link href={localePath(locale, `/gourmet/${genre}/`)}>
                      {t.gourmetGenres[genre]} ({items.length})
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <PlaceList headingLevel={3} places={getPlacesByType(type)} />
            )}
          </Section>
        ))}
      </Section>
    </>
  )
}

export default Page
