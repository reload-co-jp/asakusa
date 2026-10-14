import { Metadata } from "next"
import { FC } from "react"
import { Breadcrumbs } from "@/components/elements/breadcrumbs"
import { ContentList, Section } from "@/components/elements/content"
import { EventNavigation } from "@/components/elements/event-hub"
import { getContentsByArea } from "@/lib/data"
import { alternates, getDictionary, localePath } from "@/lib/i18n"
import { Area, AREAS } from "@/lib/types"

export const generateStaticParams = () =>
  Object.keys(AREAS).map((area) => ({ area }))

export const dynamicParams = false

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ area: Area }>
}): Promise<Metadata> => {
  const { area } = await params
  const { locale, t } = await getDictionary()
  const path = `/area/${area}/`
  const name = t.areas[area]
  const title = `${t.area.title(name)}｜${t.siteName}`
  const count = getContentsByArea(area).length
  const description = t.area.description(name, count)
  return {
    title,
    description,
    alternates: alternates(locale, path),
    // 記事0件の薄いページはインデックスさせない
    ...(count === 0 && { robots: { index: false, follow: true } }),
    openGraph: {
      title,
      description,
      type: "website",
      url: localePath(locale, path),
    },
  }
}

const Page: FC<{ params: Promise<{ area: Area }> }> = async ({ params }) => {
  const { area } = await params
  const { t } = await getDictionary()
  const name = t.areas[area]
  const contents = getContentsByArea(area)
  return (
    <>
      <Breadcrumbs
        items={[
          { name: t.nav.areas, href: "/area/" },
          { name, href: `/area/${area}/` },
        ]}
      />
      <Section
        description={t.area.description(name, contents.length)}
        level={1}
        title={t.area.title(name)}
      >
        <ContentList contents={contents} />
      </Section>
      <EventNavigation />
    </>
  )
}

export default Page
