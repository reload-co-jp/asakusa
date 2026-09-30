import { Metadata } from "next"
import { FC } from "react"
import { LinkList } from "@/components/elements/breadcrumbs"
import { ContentList, Section } from "@/components/elements/content"
import { EventCarousel } from "@/components/elements/event-carousel"
import { EventNavigation } from "@/components/elements/event-hub"
import {
  getLatestContents,
  getOngoingContentsByCategory,
  getThisWeekEvents,
  getTodayEvents,
  getUpcomingDaysEvents,
  getWeekendEvents,
  getContentsByCategory,
  localizePlace,
  places,
} from "@/lib/data"
import { alternates, getDictionary } from "@/lib/i18n"

export const generateMetadata = async (): Promise<Metadata> => {
  const { locale } = await getDictionary()
  return { alternates: alternates(locale, "/") }
}

const Page: FC = async () => {
  const { locale, t } = await getDictionary()
  return (
    <>
      <h1
        style={{
          color: "var(--muted)",
          fontSize: ".85rem",
          fontWeight: 400,
          margin: "0 0 2.5rem",
        }}
      >
        {t.home.heading}
      </h1>
      <EventCarousel contents={getUpcomingDaysEvents().slice(0, 5)} />
      <Section title={t.home.today}>
        <ContentList contents={getTodayEvents()} />
      </Section>
      <Section title={t.home.thisWeek}>
        <ContentList contents={getThisWeekEvents()} />
      </Section>
      <Section title={t.home.weekend}>
        <ContentList contents={getWeekendEvents()} />
      </Section>
      <Section title={t.home.newOpening}>
        <ContentList contents={getContentsByCategory("new_opening")} />
      </Section>
      <Section title={t.home.sale}>
        <ContentList contents={getOngoingContentsByCategory("sale")} />
      </Section>
      <Section title={t.home.latest}>
        <ContentList contents={getLatestContents(10)} />
      </Section>
      <EventNavigation />
      <Section title={t.home.places}>
        <LinkList
          links={places.map((place) => ({
            name: localizePlace(place, locale).name,
            href: `/place/${place.id}/`,
          }))}
        />
      </Section>
    </>
  )
}

export default Page
