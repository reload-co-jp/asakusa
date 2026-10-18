import { Metadata } from "next"
import Link from "next/link"
import { FC } from "react"
import { Breadcrumbs } from "@/components/elements/breadcrumbs"
import { Section } from "@/components/elements/content"
import { PlaceList } from "@/components/elements/place-list"
import { getPlacesByType, getRestaurantsByGenre, placeTypes } from "@/lib/data"
import { alternates, getDictionary, localePath } from "@/lib/i18n"
import { PlaceType } from "@/lib/types"

export const generateStaticParams = () => placeTypes.map((type) => ({ type }))

export const dynamicParams = false

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ type: PlaceType }>
}): Promise<Metadata> => {
  const { type } = await params
  const { locale, t } = await getDictionary()
  const path = `/place/type/${type}/`
  const name = t.placeTypes[type]
  const title = `${t.place.typeTitle(name)}｜${t.siteName}`
  const description = t.place.typeDescription(
    name,
    getPlacesByType(type).length
  )
  return {
    title,
    description,
    alternates: alternates(locale, path),
    openGraph: {
      title,
      description,
      type: "website",
      url: localePath(locale, path),
    },
  }
}

const Page: FC<{ params: Promise<{ type: PlaceType }> }> = async ({
  params,
}) => {
  const { type } = await params
  const { locale, t } = await getDictionary()
  const name = t.placeTypes[type]
  const items = getPlacesByType(type)
  return (
    <>
      <Breadcrumbs
        items={[
          { name: t.nav.places, href: "/place/" },
          { name, href: `/place/type/${type}/` },
        ]}
      />
      <Section
        description={t.place.typeDescription(name, items.length)}
        level={1}
        title={t.place.typeTitle(name)}
      >
        {type === "restaurant" ? (
          getRestaurantsByGenre().map(([genre, restaurants]) => (
            <Section
              id={genre}
              key={genre}
              more={{
                href: localePath(locale, `/gourmet/${genre}/`),
                label: t.gourmet.more(t.gourmetGenres[genre]),
              }}
              title={t.gourmetGenres[genre]}
            >
              <PlaceList headingLevel={3} places={restaurants} />
            </Section>
          ))
        ) : (
          <PlaceList places={items} />
        )}
      </Section>
      <nav aria-label={t.nav.places} style={{ margin: "0 0 2rem" }}>
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
          {placeTypes
            .filter((other) => other !== type)
            .map((other) => (
              <li key={other}>
                <Link href={localePath(locale, `/place/type/${other}/`)}>
                  {t.placeTypes[other]}
                </Link>
              </li>
            ))}
        </ul>
      </nav>
    </>
  )
}

export default Page
