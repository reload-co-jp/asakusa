import { Metadata } from "next"
import { FC } from "react"
import { Breadcrumbs } from "@/components/elements/breadcrumbs"
import { Section } from "@/components/elements/content"
import { PlaceList } from "@/components/elements/place-list"
import { getGourmetPlaces, places } from "@/lib/data"
import { alternates, getDictionary, localePath } from "@/lib/i18n"
import { GOURMET_GENRES, GourmetGenre } from "@/lib/types"

const GENRES = Object.keys(GOURMET_GENRES) as GourmetGenre[]

export const generateMetadata = async (): Promise<Metadata> => {
  const { locale, t } = await getDictionary()
  const title = t.gourmet.listTitle
  const description = t.gourmet.listDescription(
    places.filter((place) => place.genre).length
  )
  return {
    title,
    description,
    alternates: alternates(locale, "/gourmet/"),
    openGraph: {
      title,
      description,
      type: "website",
      url: localePath(locale, "/gourmet/"),
    },
  }
}

const Page: FC = async () => {
  const { locale, t } = await getDictionary()
  const count = places.filter((place) => place.genre).length
  return (
    <>
      <Breadcrumbs items={[{ name: t.nav.gourmet, href: "/gourmet/" }]} />
      <Section
        description={t.gourmet.listDescription(count)}
        level={1}
        title={t.gourmet.listHeading}
      >
        {GENRES.map((genre) => (
          <Section
            id={genre}
            key={genre}
            more={{
              href: localePath(locale, `/gourmet/${genre}/`),
              label: t.gourmet.more(t.gourmetGenres[genre]),
            }}
            title={t.gourmetGenres[genre]}
          >
            <PlaceList headingLevel={3} places={getGourmetPlaces(genre)} />
          </Section>
        ))}
      </Section>
    </>
  )
}

export default Page
