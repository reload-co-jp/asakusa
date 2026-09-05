import { Metadata } from "next"
import { FC } from "react"
import { ContentList, Section } from "@/components/elements/content"
import { getContentsByCategory } from "@/lib/data"
import { CATEGORIES, Category } from "@/lib/types"

export const generateStaticParams = () =>
  Object.keys(CATEGORIES).map((category) => ({ category }))

export const dynamicParams = false

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ category: Category }>
}): Promise<Metadata> => {
  const { category } = await params
  const label = CATEGORIES[category]
  const title = `${label}の情報 | 浅草ライブ`
  const description = `浅草エリアの${label}に関する最新情報一覧`
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
  }
}

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
