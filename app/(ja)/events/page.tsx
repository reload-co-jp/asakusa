import { Metadata } from "next"
import { FC } from "react"
import {
  Breadcrumbs,
  JsonLd,
  LinkList,
} from "@/components/elements/breadcrumbs"
import {
  ContentList,
  EventList,
  FeatureStory,
  Section,
} from "@/components/elements/content"
import {
  EventGantt,
  EventNavigation,
  itemListJsonLd,
} from "@/components/elements/event-hub"
import {
  getArchiveMonths,
  getTodayEvents,
  getUpcomingEvents,
  getWeekendEvents,
} from "@/lib/data"
import { formatMonth, formatShortDate, jstDateString } from "@/lib/date"
import { alternates, getDictionary, localePath } from "@/lib/i18n"
import { isLargeImage } from "@/lib/image-size"

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
  const today = getTodayEvents()
  const weekend = getWeekendEvents()
  const featured = events.find((content) => isLargeImage(content.image_url))
  const href = (path: string) => localePath(locale, path)
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
        description={
          <>
            {t.events.description}
            <br />
            {t.events.lead(events.length)}
          </>
        }
        eyebrow="EVENTS"
        level={1}
        title={t.events.heading}
      >
        {featured && <FeatureStory content={featured} />}
      </Section>
      {today.length > 0 && (
        <Section
          eyebrow={`TODAY — ${formatShortDate(jstDateString(), true)}`}
          more={{ href: href("/today/"), label: t.home.viewAll }}
          title={t.home.today}
        >
          <EventList contents={today.slice(0, 8)} />
        </Section>
      )}
      {weekend.length > 0 && (
        <div className="band band--gray">
          <Section
            eyebrow="THIS WEEKEND"
            more={{ href: href("/weekend/"), label: t.home.viewAll }}
            title={t.home.weekend}
          >
            <ContentList contents={weekend.slice(0, 6)} />
          </Section>
        </div>
      )}
      <Section eyebrow="SCHEDULE" title={t.events.schedule}>
        <EventGantt events={events} />
      </Section>
      <Section eyebrow="ALL EVENTS" title={t.events.upcoming}>
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
