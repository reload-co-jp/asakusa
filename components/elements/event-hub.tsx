import { Metadata } from "next"
import { FC } from "react"
import {
  Breadcrumbs,
  JsonLd,
  LinkList,
} from "@/components/elements/breadcrumbs"
import { ContentList, Section } from "@/components/elements/content"
import { getCategoryCount, getEventsInPeriod } from "@/lib/data"
import { formatPeriod, jstDateString, Period } from "@/lib/date"
import { SITE_URL } from "@/lib/json-ld"
import { CATEGORIES, Category } from "@/lib/types"

export const PERIOD_LINKS = [
  { name: "今日", href: "/today/" },
  { name: "今週", href: "/this-week/" },
  { name: "今週末", href: "/weekend/" },
  { name: "来週", href: "/next-week/" },
  { name: "今月", href: "/this-month/" },
]

const GENRES: Category[] = [
  "festival",
  "performance",
  "event",
  "exhibition",
  "popup",
  "sale",
  "campaign",
  "new_opening",
]

// 記事が存在するカテゴリのみリンクし、空ページへの内部リンクを作らない
export const genreLinks = () =>
  GENRES.filter((category) => getCategoryCount(category) > 0).map(
    (category) => ({
      name: CATEGORIES[category],
      href: `/category/${category}/`,
    })
  )

export const itemListJsonLd = (ids: number[]) => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: ids.map((id, index) => ({
    "@type": "ListItem",
    position: index + 1,
    url: `${SITE_URL}/content/${id}/`,
  })),
})

export type PeriodPageConfig = {
  path: string
  // パンくず・見出しに使う短い名前(例: 今週末)
  label: string
  getPeriod: (now?: Date) => Period
  title?: (period: Period) => string
}

const pageTitle = ({ label, getPeriod, title }: PeriodPageConfig): string =>
  title
    ? title(getPeriod())
    : `${label}の浅草イベント｜${formatPeriod(getPeriod())}`

export const periodMetadata = (config: PeriodPageConfig): Metadata => {
  const period = formatPeriod(config.getPeriod())
  const title = `${pageTitle(config)}｜浅草ライブ`
  const description = `${period}に浅草で開催されるイベント・祭り・公演・演芸・展示・POP UP情報を一覧でまとめています。浅草寺・浅草公会堂・浅草ROXなど施設別の開催情報も掲載。`
  return {
    title,
    description,
    alternates: { canonical: config.path },
    openGraph: { title, description, type: "website", url: config.path },
  }
}

// /today/ /this-week/ 等の日付ページ共通レイアウト。
// 静的exportのため日付はビルド時(JST)に確定し、毎日のスケジュールビルドで更新する
export const PeriodPage: FC<{ config: PeriodPageConfig }> = ({ config }) => {
  const { from, to } = config.getPeriod()
  const events = getEventsInPeriod(from, to)
  return (
    <>
      <Breadcrumbs
        items={[
          { name: "イベント", href: "/events/" },
          { name: config.label, href: config.path },
        ]}
      />
      <JsonLd data={itemListJsonLd(events.map((content) => content.id))} />
      <Section
        description={`${formatPeriod({ from, to })}に浅草で開催中・開催予定のイベント ${events.length}件（${jstDateString()}更新）`}
        level={1}
        title={pageTitle(config)}
      >
        <ContentList contents={events} />
      </Section>
      <EventNavigation current={config.path} />
    </>
  )
}

export const EventNavigation: FC<{ current?: string }> = ({ current }) => (
  <>
    <Section title="期間から探す">
      <LinkList links={PERIOD_LINKS.filter((link) => link.href !== current)} />
    </Section>
    <Section title="ジャンルから探す">
      <LinkList links={genreLinks()} />
    </Section>
  </>
)
