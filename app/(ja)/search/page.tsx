import { Metadata } from "next"
import { FC, Suspense } from "react"
import { ContentCard, localized, Section } from "@/components/elements/content"
import { SearchResults } from "@/components/elements/search-results"
import { getLatestContents } from "@/lib/data"
import { getDictionary } from "@/lib/i18n"

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getDictionary()
  return {
    title: `${t.search.title}｜${t.siteName}`,
    robots: { index: false, follow: true },
  }
}

const Page: FC = async () => {
  const { locale, t } = await getDictionary()
  const items = getLatestContents().map((content) => {
    const { content: c, place } = localized(content, locale)
    return {
      key: content.id,
      text: [c.title, c.summary, place?.name, t.categories[c.category]]
        .join(" ")
        .toLowerCase(),
      node: <ContentCard content={content} locale={locale} />,
    }
  })
  return (
    <Section level={1} title={t.search.title}>
      <Suspense>
        <SearchResults
          count={t.search.count}
          empty={t.search.empty}
          items={items}
        />
      </Suspense>
    </Section>
  )
}

export default Page
