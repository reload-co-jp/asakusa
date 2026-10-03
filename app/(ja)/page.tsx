import { Metadata } from "next"
import Image from "next/image"
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
  getWeekendEvents,
  getContentsByCategory,
  localizePlace,
  places,
} from "@/lib/data"
import { formatShortDate, jstDateString } from "@/lib/date"
import { alternates, getDictionary, localePath } from "@/lib/i18n"

export const generateMetadata = async (): Promise<Metadata> => {
  const { locale } = await getDictionary()
  return { alternates: alternates(locale, "/") }
}

const Page: FC = async () => {
  const { locale, t } = await getDictionary()
  const href = (path: string) => localePath(locale, path)
  const today = getTodayEvents()
  const latest = getLatestContents(12)
  return (
    <>
      <section className="hero" style={{ marginTop: "-2rem" }}>
        <Image
          alt={t.home.heroAlt}
          fill
          priority
          sizes="100vw"
          src="/images/hero.webp"
        />
        <h1 className="hero__eyebrow">{t.home.heading}</h1>
        <p className="hero__title">{t.home.hero}</p>
        <div className="hero__actions">
          <a className="hero__action" href={href("/today/")}>
            {t.nav.today} {formatShortDate(jstDateString(), true)}
          </a>
          <a
            className="hero__action hero__action--ghost"
            href={href("/weekend/")}
          >
            {t.nav.weekend} →
          </a>
        </div>
      </section>

      <div style={{ height: "clamp(3rem, 7vw, 5.5rem)" }} />
      <Section
        description={t.home.todayLead}
        eyebrow={`TODAY — ${formatShortDate(jstDateString(), true)}`}
        title={t.home.today}
      >
        <ContentList contents={today} />
      </Section>

      <div className="band band--gray">
        <Section eyebrow="THIS WEEKEND" title={t.home.weekend}>
          <EventCarousel contents={getWeekendEvents()} />
        </Section>
      </div>

      <div style={{ height: "clamp(3rem, 7vw, 5.5rem)" }} />
      <Section eyebrow="THIS WEEK" title={t.home.thisWeek}>
        <ContentList contents={getThisWeekEvents()} />
      </Section>
      <Section eyebrow="NEW OPEN" title={t.home.newOpening}>
        <EventCarousel contents={getContentsByCategory("new_opening")} />
      </Section>
      <Section eyebrow="SALE" title={t.home.sale}>
        <ContentList contents={getOngoingContentsByCategory("sale")} />
      </Section>

      <div className="band band--paper">
        <Section eyebrow="LATEST" id="latest" title={t.home.latest}>
          <ContentList contents={latest} />
        </Section>
      </div>

      <div style={{ height: "clamp(3rem, 7vw, 5.5rem)" }} />
      <EventNavigation />
      <Section eyebrow="SPOTS" title={t.home.places}>
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
