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

type Params = Promise<{ year: string; month: string }>

export const generateStaticParams = () => getArchiveMonths()

export const dynamicParams = false

const label = (year: string, month: string) => `${year}年${Number(month)}月`

export const generateMetadata = async ({
  params,
}: {
  params: Params
}): Promise<Metadata> => {
  const { year, month } = await params
  const path = `/events/${year}/${month}/`
  const title = `${label(year, month)}の浅草イベント・祭り・公演一覧｜浅草ライブ`
  const description = `${label(year, month)}に浅草で開催された・開催されるイベント${getMonthEvents(year, month).length}件の一覧。祭り・伝統行事、公演・演芸、展示、POP UPなどの開催日・会場をまとめています。`
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, type: "website", url: path },
  }
}

const Page: FC<{ params: Params }> = async ({ params }) => {
  const { year, month } = await params
  const events = getMonthEvents(year, month)
  if (events.length === 0) notFound()
  const path = `/events/${year}/${month}/`
  return (
    <>
      <Breadcrumbs
        items={[
          { name: "イベント", href: "/events/" },
          { name: label(year, month), href: path },
        ]}
      />
      <JsonLd data={itemListJsonLd(events.map((content) => content.id))} />
      <Section
        description={`${label(year, month)}に浅草で開催のイベント ${events.length}件`}
        level={1}
        title={`${label(year, month)}の浅草イベント`}
      >
        <ContentList contents={events} />
      </Section>
      <EventNavigation />
    </>
  )
}

export default Page
