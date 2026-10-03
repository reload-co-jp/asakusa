import { FC } from "react"
import { ContentCard } from "@/components/elements/content"
import { getDictionary } from "@/lib/i18n"
import { Content } from "@/lib/types"

// JS不要のCSS scroll-snapによる横スクロールカルーセル。端のカードを少し見せて続きを示す
export const EventCarousel: FC<{ contents: Content[] }> = async ({
  contents,
}) => {
  if (contents.length === 0) return null
  const { locale, t } = await getDictionary()
  return (
    <ul aria-label={t.carousel.label} className="rail">
      {contents.map((content) => (
        <li key={content.id}>
          <ContentCard content={content} locale={locale} />
        </li>
      ))}
    </ul>
  )
}
