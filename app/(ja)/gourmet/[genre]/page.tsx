import { Metadata } from "next"
import Link from "next/link"
import { FC } from "react"
import { Breadcrumbs } from "@/components/elements/breadcrumbs"
import { Section } from "@/components/elements/content"
import { PlaceList } from "@/components/elements/place-list"
import { getGourmetPlaces } from "@/lib/data"
import { alternates, getDictionary, localePath } from "@/lib/i18n"
import { GOURMET_GENRES, GourmetGenre } from "@/lib/types"

const GENRES = Object.keys(GOURMET_GENRES) as GourmetGenre[]

export const generateStaticParams = () => GENRES.map((genre) => ({ genre }))

export const dynamicParams = false

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ genre: GourmetGenre }>
}): Promise<Metadata> => {
  const { genre } = await params
  const { locale, t } = await getDictionary()
  const path = `/gourmet/${genre}/`
  const name = t.gourmetGenres[genre]
  const title = `${t.gourmet.genreTitle(name)}｜${t.siteName}`
  const description = t.gourmet.genreDescription(
    name,
    getGourmetPlaces(genre).length
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

const Page: FC<{ params: Promise<{ genre: GourmetGenre }> }> = async ({
  params,
}) => {
  const { genre } = await params
  const { locale, t } = await getDictionary()
  const name = t.gourmetGenres[genre]
  const items = getGourmetPlaces(genre)
  return (
    <>
      <Breadcrumbs
        items={[
          { name: t.nav.gourmet, href: "/gourmet/" },
          { name, href: `/gourmet/${genre}/` },
        ]}
      />
      <Section
        description={t.gourmet.genreDescription(name, items.length)}
        level={1}
        title={t.gourmet.genreTitle(name)}
      >
        <PlaceList places={items} />
      </Section>
      <nav aria-label={t.nav.gourmet} style={{ margin: "0 0 2rem" }}>
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
          {GENRES.filter((other) => other !== genre).map((other) => (
            <li key={other}>
              <Link href={localePath(locale, `/gourmet/${other}/`)}>
                {t.gourmetGenres[other]}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}

export default Page
