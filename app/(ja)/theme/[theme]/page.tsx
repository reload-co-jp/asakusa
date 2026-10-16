import { Metadata } from "next"
import { FC } from "react"
import { Breadcrumbs, JsonLd } from "@/components/elements/breadcrumbs"
import { ContentList, Section } from "@/components/elements/content"
import {
  EventNavigation,
  itemListJsonLd,
} from "@/components/elements/event-hub"
import { getThemeEvents } from "@/lib/data"
import { alternates, getDictionary, localePath } from "@/lib/i18n"
import { Theme, THEMES } from "@/lib/types"

export const generateStaticParams = () =>
  Object.keys(THEMES).map((theme) => ({ theme }))

export const dynamicParams = false

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ theme: Theme }>
}): Promise<Metadata> => {
  const { theme } = await params
  const { locale, t } = await getDictionary()
  const path = `/theme/${theme}/`
  const title = `${t.themes[theme].title}｜${t.siteName}`
  const { description } = t.themes[theme]
  return {
    title,
    description,
    alternates: alternates(locale, path),
    // 該当イベント0件の時期は薄いページになるためインデックスさせない
    ...(getThemeEvents(theme).length === 0 && {
      robots: { index: false, follow: true },
    }),
    openGraph: {
      title,
      description,
      type: "website",
      url: localePath(locale, path),
    },
  }
}

// 静的exportのため該当イベントはビルド時に確定し、毎日のスケジュールビルドで更新する
const Page: FC<{ params: Promise<{ theme: Theme }> }> = async ({ params }) => {
  const { theme } = await params
  const { locale, t } = await getDictionary()
  const path = `/theme/${theme}/`
  const events = getThemeEvents(theme)
  return (
    <>
      <Breadcrumbs
        items={[
          { name: t.nav.events, href: "/events/" },
          { name: t.themes[theme].label, href: path },
        ]}
      />
      <JsonLd
        data={itemListJsonLd(
          events.map((content) => content.id),
          locale
        )}
      />
      <Section
        description={t.themes[theme].description}
        eyebrow="EVENTS"
        level={1}
        title={t.themes[theme].title}
      >
        <ContentList contents={events} />
      </Section>
      <EventNavigation current={path} />
    </>
  )
}

export default Page
