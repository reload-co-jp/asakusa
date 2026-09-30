import { Metadata } from "next"
import { FC } from "react"
import { Breadcrumbs, Crumb } from "@/components/elements/breadcrumbs"
import { ContentList, Section } from "@/components/elements/content"
import { EventNavigation } from "@/components/elements/event-hub"
import { getCategoryCount, getContentsByCategory } from "@/lib/data"
import { alternates, getDictionary, localePath } from "@/lib/i18n"
import { CATEGORIES, Category, EVENT_CATEGORIES } from "@/lib/types"

export const generateStaticParams = () =>
  Object.keys(CATEGORIES).map((category) => ({ category }))

export const dynamicParams = false

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ category: Category }>
}): Promise<Metadata> => {
  const { category } = await params
  const { locale, t } = await getDictionary()
  const path = `/category/${category}/`
  const title = `${t.categoryTitles[category]}｜${t.siteName}`
  const count = getCategoryCount(category)
  const description = t.category.description(
    t.categoryDescriptions[category],
    count
  )
  return {
    title,
    description,
    alternates: alternates(locale, path),
    // 既存URL互換のためページは残すが、記事0件の薄いページはインデックスさせない
    ...(count === 0 && { robots: { index: false, follow: true } }),
    openGraph: {
      title,
      description,
      type: "website",
      url: localePath(locale, path),
    },
  }
}

const Page: FC<{ params: Promise<{ category: Category }> }> = async ({
  params,
}) => {
  const { category } = await params
  const { t } = await getDictionary()
  const crumbs: Crumb[] = [
    ...(EVENT_CATEGORIES.includes(category)
      ? [{ name: t.nav.events, href: "/events/" }]
      : []),
    { name: t.categories[category], href: `/category/${category}/` },
  ]
  return (
    <>
      <Breadcrumbs items={crumbs} />
      <Section
        description={t.categoryDescriptions[category]}
        level={1}
        title={t.categoryTitles[category]}
      >
        <ContentList contents={getContentsByCategory(category)} />
      </Section>
      <EventNavigation />
    </>
  )
}

export default Page
