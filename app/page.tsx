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
  places,
} from "@/lib/data"

export const metadata: Metadata = {
  alternates: { canonical: "/" },
}

const Page: FC = () => {
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
        浅草のイベント・祭り・公演・新店舗・地域ニュース
      </h1>
      <EventCarousel contents={getUpcomingDaysEvents().slice(0, 5)} />
      <Section title="今日の浅草">
        <ContentList contents={getTodayEvents()} />
      </Section>
      <Section title="今週の浅草">
        <ContentList contents={getThisWeekEvents()} />
      </Section>
      <Section title="今週末の浅草イベント">
        <ContentList contents={getWeekendEvents()} />
      </Section>
      <Section title="浅草の新店舗">
        <ContentList contents={getContentsByCategory("new_opening")} />
      </Section>
      <Section title="現在開催中のセール">
        <ContentList contents={getOngoingContentsByCategory("sale")} />
      </Section>
      <Section title="浅草の最新情報">
        <ContentList contents={getLatestContents(10)} />
      </Section>
      <EventNavigation />
      <Section title="施設から探す">
        <LinkList
          links={places.map((place) => ({
            name: place.name,
            href: `/place/${place.id}/`,
          }))}
        />
      </Section>
    </>
  )
}

export default Page
