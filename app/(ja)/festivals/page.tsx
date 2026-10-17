import { Metadata } from "next"
import Link from "next/link"
import { FC, Fragment } from "react"
import { Breadcrumbs } from "@/components/elements/breadcrumbs"
import { formatContentPeriod, Section } from "@/components/elements/content"
import { EventNavigation } from "@/components/elements/event-hub"
import { festivals, getNextFestivalEvent } from "@/lib/data"
import { alternates, getDictionary, localePath } from "@/lib/i18n"

const path = "/festivals/"

export const generateMetadata = async (): Promise<Metadata> => {
  const { locale, t } = await getDictionary()
  const { title, description } = t.festivals
  return {
    title,
    description,
    alternates: alternates(locale, path),
    openGraph: {
      title,
      description,
      type: "website",
      url: localePath(locale, path),
    },
  }
}

// 例年の時期は固定データ。「次回」は開催予定記事からビルド時に確定する
const Page: FC = async () => {
  const { locale, t } = await getDictionary()
  const months = [...new Set(festivals.map((festival) => festival.month))]
  return (
    <>
      <Breadcrumbs
        items={[
          { name: t.nav.events, href: "/events/" },
          { name: t.festivals.label, href: path },
        ]}
      />
      <Section
        description={t.festivals.lead}
        eyebrow="FESTIVALS"
        level={1}
        title={t.festivals.heading}
      >
        {months.map((month) => (
          <Fragment key={month}>
            <h2 className="section__title">{t.festivals.month(month)}</h2>
            <ol className="event-list">
              {festivals
                .filter((festival) => festival.month === month)
                .map((festival) => {
                  const next = getNextFestivalEvent(festival)
                  return (
                    <li className="event-row" key={festival.keyword}>
                      <div className="event-row__body">
                        <h3 className="event-row__title">
                          {festival.name[locale]}
                        </h3>
                        <p className="event-row__info">
                          <span className="card__date">
                            {festival.date[locale]}
                          </span>
                          <span>{festival.venue[locale]}</span>
                        </p>
                        <p>{festival.description[locale]}</p>
                        {next && (
                          <p className="event-row__info">
                            <Link
                              href={localePath(locale, `/content/${next.id}/`)}
                            >
                              {t.festivals.next}:{" "}
                              {formatContentPeriod(next, locale)}
                            </Link>
                          </p>
                        )}
                      </div>
                    </li>
                  )
                })}
            </ol>
          </Fragment>
        ))}
      </Section>
      <EventNavigation current={path} />
    </>
  )
}

export default Page
