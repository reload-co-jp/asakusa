import { FC } from "react"
import { ContentList, Section } from "@/components/elements/content"
import {
  getLatestContents,
  getOngoingContentsByCategory,
  getThisWeekEvents,
  getTodayEvents,
  getWeekendEvents,
  getContentsByCategory,
} from "@/lib/data"

const Page: FC = () => {
  return (
    <>
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
    </>
  )
}

export default Page
