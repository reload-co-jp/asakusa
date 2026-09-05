import { FC } from "react"
import { ContentList, Section } from "@/components/elements/content"
import { getContentsByCategory } from "@/lib/data"
import { CATEGORIES, Category } from "@/lib/types"

export const generateStaticParams = () =>
  Object.keys(CATEGORIES).map((category) => ({ category }))

export const dynamicParams = false

const Page: FC<{ params: Promise<{ category: Category }> }> = async ({
  params,
}) => {
  const { category } = await params
  return (
    <Section title={CATEGORIES[category]}>
      <ContentList contents={getContentsByCategory(category)} />
    </Section>
  )
}

export default Page
