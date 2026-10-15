import { Metadata } from "next"
import { FC } from "react"
import { Breadcrumbs } from "@/components/elements/breadcrumbs"
import { Section } from "@/components/elements/content"
import { PlaceList } from "@/components/elements/place-list"
import { places } from "@/lib/data"
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
  const { t } = await getDictionary()
  return (
    <>
      <Breadcrumbs items={[{ name: t.nav.places, href: "/place/" }]} />
      <Section
        description={t.place.listLead}
        level={1}
        title={t.place.listHeading}
      >
        <PlaceList places={places} />
      </Section>
    </>
  )
}

export default Page
