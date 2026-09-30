import { Metadata } from "next"
import { notFound } from "next/navigation"
import { FC } from "react"
import { Breadcrumbs, JsonLd } from "@/components/elements/breadcrumbs"
import { ContentList, Section } from "@/components/elements/content"
import {
  EventNavigation,
  itemListJsonLd,
} from "@/components/elements/event-hub"
import { getArchiveMonths, getMonthEvents } from "@/lib/data"
import { formatMonth } from "@/lib/date"
import { alternates, getDictionary, localePath } from "@/lib/i18n"

type Params = Promise<{ year: string; month: string }>

export const generateStaticParams = () => getArchiveMonths()

export const dynamicParams = false

export const generateMetadata = async ({
  params,
}: {
  params: Params
}): Promise<Metadata> => {
  const { year, month } = await params
  const { locale, t } = await getDictionary()
  const path = `/events/${year}/${month}/`
  const label = formatMonth(year, month, locale)
  const title = t.events.monthTitle(label)
  const description = t.events.monthDescription(
    label,
    getMonthEvents(year, month).length
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

const Page: FC<{ params: Params }> = async ({ params }) => {
  const { year, month } = await params
  const events = getMonthEvents(year, month)
  if (events.length === 0) notFound()
  const { locale, t } = await getDictionary()
  const path = `/events/${year}/${month}/`
  const label = formatMonth(year, month, locale)
  return (
    <>
      <Breadcrumbs
        items={[
          { name: t.nav.events, href: "/events/" },
          { name: label, href: path },
        ]}
      />
      <JsonLd
        data={itemListJsonLd(
          events.map((content) => content.id),
          locale
        )}
      />
      <Section
        description={t.events.monthLead(label, events.length)}
        level={1}
        title={t.events.monthHeading(label)}
      >
        <ContentList contents={events} />
      </Section>
      <EventNavigation />
    </>
  )
}

export default Page
