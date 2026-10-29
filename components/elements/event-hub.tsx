import Link from "next/link"
import { Metadata } from "next"
import { FC } from "react"
import {
  Breadcrumbs,
  JsonLd,
  LinkList,
} from "@/components/elements/breadcrumbs"
import { ContentList, Section } from "@/components/elements/content"
import {
  getCategoryCount,
  getEventsInPeriod,
  getThemeEvents,
  localizeContent,
} from "@/lib/data"
import {
  addDays,
  daysBetween,
  formatPeriod,
  formatShortDate,
  jstDateString,
  Period,
} from "@/lib/date"
import {
  alternates,
  DICTIONARIES,
  getDictionary,
  Locale,
  localePath,
} from "@/lib/i18n"
import { SITE_URL } from "@/lib/json-ld"
import { Category, Content, Theme, THEMES } from "@/lib/types"

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
        description={
          <>
            {t.hub.periodDescription(formatPeriod({ from, to }, locale))}
            <br />
            {t.hub.periodLead(
              formatPeriod({ from, to }, locale),
              events.length,
              jstDateString()
            )}
          </>
        }
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
      <Section eyebrow="BY THEME" title={t.hub.byTheme}>
        <LinkList
          links={(Object.keys(THEMES) as Theme[])
            .filter(
              (theme) =>
                `/theme/${theme}/` !== current &&
                getThemeEvents(theme).length > 0
            )
            .map((theme) => ({
              name: t.themes[theme].label,
              href: `/theme/${theme}/`,
            }))
            .concat(
              current === "/festivals/"
                ? []
                : [{ name: t.festivals.label, href: "/festivals/" }]
            )}
        />
      </Section>
    </>
  )
}

const GANTT_DAYS = 56
// バーの色分け。これ以外のカテゴリは既定色
const GANTT_CATEGORIES: Category[] = [
  "festival",
  "performance",
  "exhibition",
  "popup",
  "new_opening",
]

// 今日から8週間の開催期間をバー表示。期間外にはみ出す部分は切り詰める
export const EventGantt: FC<{ events: Content[] }> = async ({ events }) => {
  const { locale, t } = await getDictionary()
  const today = jstDateString()
  const last = addDays(today, GANTT_DAYS - 1)
  const percent = (days: number) => `${(days / GANTT_DAYS) * 100}%`
  const rows = events.filter((content) => content.start_at! <= last)
  return (
    <div className="gantt">
      <ul className="gantt__legend">
        {GANTT_CATEGORIES.map((category) => (
          <li data-category={category} key={category}>
            {t.categories[category]}
          </li>
        ))}
      </ul>
      <div className="gantt__row gantt__row--head">
        <span />
        <div className="gantt__track">
          {Array.from({ length: GANTT_DAYS / 7 }, (_, week) => (
            <span
              className="gantt__tick"
              key={week}
              style={{ left: percent(week * 7) }}
            >
              {formatShortDate(addDays(today, week * 7))}
            </span>
          ))}
        </div>
      </div>
      {rows.map((content) => {
        const start = content.start_at! < today ? today : content.start_at!
        const end = content.end_at ?? content.start_at!
        const clippedEnd = end > last ? last : end
        return (
          <div className="gantt__row" key={content.id}>
            <Link
              className="gantt__title"
              href={localePath(locale, `/content/${content.id}/`)}
            >
              {localizeContent(content, locale).title}
            </Link>
            <div className="gantt__track">
              <span
                className="gantt__bar"
                data-category={content.category}
                style={{
                  left: percent(daysBetween(today, start)),
                  width: percent(daysBetween(start, clippedEnd) + 1),
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
