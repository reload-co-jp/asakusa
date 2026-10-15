import { Metadata } from "next"
import Image from "next/image"
import { FC } from "react"
import { JsonLd, LinkList } from "@/components/elements/breadcrumbs"
import Link from "next/link"
import {
  ContentList,
  EventList,
  FeatureStory,
  NewsList,
  Section,
} from "@/components/elements/content"
import { EventNavigation } from "@/components/elements/event-hub"
import {
  getLatestContents,
  getOngoingContentsByCategory,
  getThisWeekEvents,
  getTodayEvents,
  getWeekendEvents,
  getContentsByCategory,
  localizePlace,
  places,
} from "@/lib/data"
import { formatShortDate, jstDateString } from "@/lib/date"
import { alternates, getDictionary, HTML_LANG, localePath } from "@/lib/i18n"
import { isLargeImage } from "@/lib/image-size"
import { SITE_URL } from "@/lib/json-ld"
import { Category, GOURMET_GENRES, GourmetGenre } from "@/lib/types"

export const generateMetadata = async (): Promise<Metadata> => {
  const { locale, t } = await getDictionary()
  const { title, description } = t.home
  // 親layoutのtitleはサイト名のみのため、トップは検索キーワードを含むtitleで上書きする
  return {
    title,
    description,
    alternates: alternates(locale, "/"),
    openGraph: {
      title,
      description,
      type: "website",
      url: localePath(locale, "/"),
    },
  }
}

// カテゴリー欄に並べるジャンル(セールは開催中を優先)
const CATEGORY_BLOCKS: Category[] = [
  "festival",
  "performance",
  "exhibition",
  "popup",
  "sale",
  "event",
]

const Page: FC = async () => {
  const { locale, t } = await getDictionary()
  const href = (path: string) => localePath(locale, path)
  const today = getTodayEvents()
  const featured = getLatestContents().find((content) =>
    isLargeImage(content.image_url)
  )
  const latest = getLatestContents(13)
    .filter((content) => content !== featured)
    .slice(0, 12)
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: t.siteName,
          alternateName: "ASAKUSA JOURNAL",
          url: `${SITE_URL}${href("/")}`,
          inLanguage: HTML_LANG[locale],
        }}
      />
      <div className="lead">
        <section className="hero">
          <Image
            alt={t.home.heroAlt}
            fill
            priority
            sizes="(min-width: 960px) 60vw, 100vw"
            src="/images/hero.webp"
          />
          <h1 className="hero__eyebrow">{t.home.heading}</h1>
          <p className="hero__title">{t.home.hero}</p>
          <div className="hero__actions">
            <a className="button" href={href("/today/")}>
              {t.nav.today} {formatShortDate(jstDateString(), true)}
            </a>
            <a className="button button--ghost" href={href("/weekend/")}>
              {t.nav.weekend} →
            </a>
          </div>
        </section>
        {featured && <FeatureStory content={featured} />}
      </div>

      <Section
        description={t.home.todayLead}
        eyebrow={`TODAY — ${formatShortDate(jstDateString(), true)}`}
        more={{ href: href("/today/"), label: t.home.viewAll }}
        title={t.home.today}
      >
        <EventList contents={today.slice(0, 8)} />
      </Section>

      <div className="band band--gray">
        <Section
          description={t.home.weekendLead}
          eyebrow="THIS WEEKEND"
          more={{ href: href("/weekend/"), label: t.home.viewAll }}
          title={t.home.weekend}
        >
          <ContentList contents={getWeekendEvents().slice(0, 9)} />
        </Section>
      </div>

      <Section
        eyebrow="THIS WEEK"
        more={{ href: href("/this-week/"), label: t.home.viewAll }}
        title={t.home.thisWeek}
      >
        <EventList contents={getThisWeekEvents().slice(0, 10)} />
      </Section>

      <Section
        description={t.home.newOpeningLead}
        eyebrow="NEW OPEN"
        more={{
          href: href("/category/new_opening/"),
          label: t.home.viewAll,
        }}
        title={t.home.newOpening}
      >
        <ContentList
          contents={getContentsByCategory("new_opening").slice(0, 7)}
        />
      </Section>

      <div className="band band--paper">
        <Section
          description={t.home.latestLead}
          eyebrow="LATEST NEWS"
          id="latest"
          more={{
            href: href("/category/local_news/"),
            label: t.nav.news,
          }}
          title={t.home.latest}
        >
          <NewsList contents={latest} />
        </Section>
      </div>

      <Section eyebrow="CATEGORIES" title={t.home.byCategory}>
        <div className="category-blocks">
          {CATEGORY_BLOCKS.map((category) => {
            const ongoing =
              category === "sale" ? getOngoingContentsByCategory("sale") : []
            const items = (
              ongoing.length > 0 ? ongoing : getContentsByCategory(category)
            ).slice(0, 3)
            if (items.length === 0) return null
            return (
              <section className="category-block" key={category}>
                <h3 className="category-block__title">
                  <Link href={href(`/category/${category}/`)}>
                    {category === "sale" && ongoing.length > 0
                      ? t.home.sale
                      : t.categories[category]}
                    <span aria-hidden="true"> →</span>
                  </Link>
                </h3>
                <NewsList compact contents={items} />
              </section>
            )
          })}
        </div>
      </Section>

      <EventNavigation />
      <Section
        eyebrow="GOURMET"
        more={{ href: href("/gourmet/"), label: t.gourmet.viewAll }}
        title={t.home.gourmet}
      >
        <LinkList
          links={(Object.keys(GOURMET_GENRES) as GourmetGenre[]).map(
            (genre) => ({
              name: t.gourmetGenres[genre],
              href: `/gourmet/${genre}/`,
            })
          )}
        />
      </Section>
      <Section eyebrow="SPOTS" title={t.home.places}>
        <LinkList
          links={places
            .filter((place) => !place.genre)
            .map((place) => ({
              name: localizePlace(place, locale).name,
              href: `/place/${place.id}/`,
            }))}
        />
      </Section>
    </>
  )
}

export default Page
