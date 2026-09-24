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

const TITLE = "浅草のイベント情報｜祭り・公演・演芸・展示・POP UP｜浅草ライブ"
const DESCRIPTION =
  "浅草で開催中・開催予定のイベントを開催日順に掲載。浅草寺・浅草神社の祭りや伝統行事、浅草公会堂・浅草演芸ホールの公演・演芸、展示やPOP UPまで、今日・今週末・今月の予定から探せます。"

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/events/" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: "/events/",
  },
}

const Page: FC = () => {
  const events = getUpcomingEvents()
  const months = getArchiveMonths()
  return (
    <>
      <Breadcrumbs items={[{ name: "イベント", href: "/events/" }]} />
      <JsonLd data={itemListJsonLd(events.map((content) => content.id))} />
      <Section
        description={`浅草で開催中・開催予定のイベント ${events.length}件`}
        level={1}
        title="浅草のイベント情報"
      >
        <ContentList contents={events} />
      </Section>
      <EventNavigation />
      {months.length > 0 && (
        <Section title="月別アーカイブ">
          <LinkList
            links={months.map(({ year, month }) => ({
              name: `${year}年${Number(month)}月`,
              href: `/events/${year}/${month}/`,
            }))}
          />
        </Section>
      )}
    </>
  )
}

export default Page
