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
import {
  alternates,
  DICTIONARIES,
  getDictionary,
  Locale,
  localePath,
} from "@/lib/i18n"
import { SITE_URL } from "@/lib/json-ld"
import { Category } from "@/lib/types"

type PeriodKey = "today" | "thisWeek" | "weekend" | "nextWeek" | "thisMonth"

const PERIOD_LINKS: { key: PeriodKey; href: string }[] = [
  { key: "today", href: "/today/" },
  { key: "thisWeek", href: "/this-week/" },
  { key: "weekend", href: "/weekend/" },
  { key: "nextWeek", href: "/next-week/" },
  { key: "thisMonth", href: "/this-month/" },
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
export const genreLinks = (locale: Locale) =>
  GENRES.filter((category) => getCategoryCount(category) > 0).map(
    (category) => ({
      name: DICTIONARIES[locale].categories[category],
      href: `/category/${category}/`,
    })
  )

export const itemListJsonLd = (ids: number[], locale: Locale) => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: ids.map((id, index) => ({
    "@type": "ListItem",
    position: index + 1,
    url: `${SITE_URL}${localePath(locale, `/content/${id}/`)}`,
  })),
})

export type PeriodPageConfig = {
  path: string
  // パンくず・見出しに使う短い名前(例: 今週末)
  label: PeriodKey
  getPeriod: (now?: Date) => Period
  title?: (period: Period, locale: Locale) => string
}

const pageTitle = (
  { label, getPeriod, title }: PeriodPageConfig,
  locale: Locale
): string => {
  const t = DICTIONARIES[locale]
  return title
    ? title(getPeriod(), locale)
    : t.hub.periodTitle(t.nav[label], formatPeriod(getPeriod(), locale))
}

export const periodMetadata =
  (config: PeriodPageConfig) => async (): Promise<Metadata> => {
    const { locale, t } = await getDictionary()
    // 日付入りtitleは再クロールまで検索結果に古い日付が残るため、日付なしにする(日付はh1に表示)
    const title = `${
      config.title
        ? pageTitle(config, locale)
        : t.hub.periodMetaTitle(t.nav[config.label])
    }｜${t.siteName}`
    const description = t.hub.periodDescription(
      formatPeriod(config.getPeriod(), locale)
    )
    return {
      title,
      description,
      alternates: alternates(locale, config.path),
      openGraph: {
        title,
        description,
        type: "website",
        url: localePath(locale, config.path),
      },
    }
  }

// /today/ /this-week/ 等の日付ページ共通レイアウト。
// 静的exportのため日付はビルド時(JST)に確定し、毎日のスケジュールビルドで更新する
export const PeriodPage: FC<{ config: PeriodPageConfig }> = async ({
  config,
}) => {
  const { locale, t } = await getDictionary()
  const { from, to } = config.getPeriod()
  const events = getEventsInPeriod(from, to)
  return (
    <>
      <Breadcrumbs
        items={[
          { name: t.nav.events, href: "/events/" },
          { name: t.nav[config.label], href: config.path },
        ]}
      />
      <JsonLd
        data={itemListJsonLd(
          events.map((content) => content.id),
          locale
        )}
      />
      {/* 毎日のビルドで内容が変わることを検索エンジンに伝える */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: pageTitle(config, locale),
          url: `${SITE_URL}${localePath(locale, config.path)}`,
          dateModified: new Date().toISOString(),
        }}
      />
      <Section
        description={t.hub.periodLead(
          formatPeriod({ from, to }, locale),
          events.length,
          jstDateString()
        )}
        eyebrow="EVENTS"
        level={1}
        title={pageTitle(config, locale)}
      >
        <ContentList contents={events} />
      </Section>
      <EventNavigation current={config.path} />
    </>
  )
}

export const EventNavigation: FC<{ current?: string }> = async ({
  current,
}) => {
  const { locale, t } = await getDictionary()
  return (
    <>
      <Section eyebrow="BY PERIOD" title={t.hub.byPeriod}>
        <LinkList
          links={PERIOD_LINKS.filter((link) => link.href !== current).map(
            ({ key, href }) => ({ name: t.nav[key], href })
          )}
        />
      </Section>
      <Section eyebrow="BY GENRE" title={t.hub.byGenre}>
        <LinkList links={genreLinks(locale)} />
      </Section>
    </>
  )
}
