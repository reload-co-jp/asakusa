import { Metadata } from "next"
import { FC } from "react"
import {
  Breadcrumbs,
  JsonLd,
  LinkList,
} from "@/components/elements/breadcrumbs"
import { ContentList, Section } from "@/components/elements/content"
import {
  EventNavigation,
  itemListJsonLd,
} from "@/components/elements/event-hub"
import { getArchiveMonths, getUpcomingEvents } from "@/lib/data"
import { formatMonth } from "@/lib/date"
import { alternates, getDictionary, localePath } from "@/lib/i18n"

export const generateMetadata = async (): Promise<Metadata> => {
  const { locale, t } = await getDictionary()
  const { title, description } = t.events
  return {
    title,
    description,
    alternates: alternates(locale, "/events/"),
    openGraph: {
      title,
      description,
      type: "website",
      url: localePath(locale, "/events/"),
    },
  }
}

const Page: FC = async () => {
  const { locale, t } = await getDictionary()
  const events = getUpcomingEvents()
  const months = getArchiveMonths()
  return (
    <>
      <Breadcrumbs items={[{ name: t.nav.events, href: "/events/" }]} />
      <JsonLd
        data={itemListJsonLd(
          events.map((content) => content.id),
          locale
        )}
      />
      <Section
        description={t.events.lead(events.length)}
        level={1}
        title={t.events.heading}
      >
        <ContentList contents={events} />
      </Section>
      <EventNavigation />
      {months.length > 0 && (
        <Section title={t.events.archive}>
          <LinkList
            links={months.map(({ year, month }) => ({
              name: formatMonth(year, month, locale),
              href: `/events/${year}/${month}/`,
            }))}
          />
        </Section>
      )}
    </>
  )
}

export default Page
