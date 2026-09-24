import { Metadata } from "next"
import { FC } from "react"
import { Breadcrumbs, Crumb } from "@/components/elements/breadcrumbs"
import { ContentList, Section } from "@/components/elements/content"
import { EventNavigation } from "@/components/elements/event-hub"
import { getCategoryCount, getContentsByCategory } from "@/lib/data"
import {
  CATEGORIES,
  CATEGORY_DESCRIPTIONS,
  CATEGORY_TITLES,
  Category,
  EVENT_CATEGORIES,
} from "@/lib/types"

export const generateStaticParams = () =>
  Object.keys(CATEGORIES).map((category) => ({ category }))

export const dynamicParams = false

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ category: Category }>
}): Promise<Metadata> => {
  const { category } = await params
  const path = `/category/${category}/`
  const title = `${CATEGORY_TITLES[category]}｜浅草ライブ`
  const count = getCategoryCount(category)
  const description = `${CATEGORY_DESCRIPTIONS[category]}。掲載${count}件を開催日・公開日順に紹介。`
  return {
    title,
    description,
    alternates: { canonical: path },
    // 既存URL互換のためページは残すが、記事0件の薄いページはインデックスさせない
    ...(count === 0 && { robots: { index: false, follow: true } }),
    openGraph: { title, description, type: "website", url: path },
  }
}

const Page: FC<{ params: Promise<{ category: Category }> }> = async ({
  params,
}) => {
  const { category } = await params
  const crumbs: Crumb[] = [
    ...(EVENT_CATEGORIES.includes(category)
      ? [{ name: "イベント", href: "/events/" }]
      : []),
    { name: CATEGORIES[category], href: `/category/${category}/` },
  ]
  return (
    <>
      <Breadcrumbs items={crumbs} />
      <Section
        description={CATEGORY_DESCRIPTIONS[category]}
        level={1}
        title={CATEGORY_TITLES[category]}
      >
        <ContentList contents={getContentsByCategory(category)} />
      </Section>
      <EventNavigation />
    </>
  )
}

export default Page
