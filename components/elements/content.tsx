import Image from "next/image"
import Link from "next/link"
import { FC, Fragment, ReactNode } from "react"
import { InArticleAd } from "@/components/elements/ad"
import { getPlace, localizeContent, localizePlace } from "@/lib/data"
import { formatDate } from "@/lib/date"
import { DICTIONARIES, getDictionary, Locale, localePath } from "@/lib/i18n"
import { Content } from "@/lib/types"

export const formatContentPeriod = (
  content: Content,
  locale: Locale
): string | null => {
  if (!content.start_at) return null
  if (!content.end_at || content.end_at === content.start_at)
    return formatDate(content.start_at, locale)
  return `${formatDate(content.start_at, locale)} 〜 ${formatDate(content.end_at, locale)}`
}

// 翻訳済みのcontentと施設を返す
export const localized = (content: Content, locale: Locale) => {
  const place = content.place_id ? getPlace(content.place_id) : undefined
  return {
    content: localizeContent(content, locale),
    place: place && localizePlace(place, locale),
  }
}

// 画像altは内容を具体的に(施設名があれば「◯◯の」を付与)。contentは翻訳済みを渡す
export const contentImageAlt = (content: Content, locale: Locale): string => {
  const place = content.place_id ? getPlace(content.place_id) : undefined
  const name = place && localizePlace(place, locale).name
  return name && !content.title.includes(name)
    ? DICTIONARIES[locale].imageAlt(name, content.title)
    : content.title
}

export const CategoryLabel: FC<{
  category: Content["category"]
  locale: Locale
}> = ({ category, locale }) => (
  <span
    style={{
      background: "var(--accent-soft)",
      color: "var(--accent)",
      display: "inline-block",
      fontSize: ".68rem",
      letterSpacing: ".08em",
      padding: ".25rem .65rem",
    }}
  >
    {DICTIONARIES[locale].categories[category]}
  </span>
)

export const ContentCard: FC<{ content: Content; locale: Locale }> = ({
  content: original,
  locale,
}) => {
  const { content, place } = localized(original, locale)
  const t = DICTIONARIES[locale]
  const href = localePath(locale, `/content/${content.id}/`)
  const period = formatContentPeriod(content, locale)
  return (
    <article
      style={{
        background: "#fff",
        display: "flex",
        gap: "1.5rem",
        padding: "1.5rem",
        transition: "box-shadow .25s ease",
      }}
    >
      {content.image_url && (
        <Link
          href={href}
          style={{ flexShrink: 0, overflow: "hidden", position: "relative" }}
        >
          <Image
            alt={contentImageAlt(content, locale)}
            height={84}
            src={content.image_url}
            style={{ objectFit: "cover" }}
            width={112}
          />
        </Link>
      )}
      <div style={{ minWidth: 0 }}>
        <CategoryLabel category={content.category} locale={locale} />
        <h3
          style={{
            fontSize: "1.02rem",
            letterSpacing: ".01em",
            lineHeight: 1.5,
            margin: ".7rem 0 .5rem",
          }}
        >
          <Link
            href={href}
            style={{ color: "var(--ink)", textDecoration: "none" }}
          >
            {content.title}
          </Link>
        </h3>
        <p style={{ color: "var(--ink-soft)", fontSize: ".85rem", margin: 0 }}>
          {content.summary}
        </p>
        <p
          style={{
            color: "var(--muted)",
            fontSize: ".72rem",
            letterSpacing: ".02em",
            margin: ".6rem 0 0",
          }}
        >
          {period
            ? t.card.held(period)
            : t.card.published(formatDate(content.published_at, locale))}
          {place ? `　${place.name}` : ""}
        </p>
      </div>
    </article>
  )
}

// 一覧の途中に広告を挟む間隔（件数）
const AD_INTERVAL = 3

export const ContentList: FC<{ contents: Content[] }> = async ({
  contents,
}) => {
  const { locale, t } = await getDictionary()
  return contents.length === 0 ? (
    <p style={{ color: "var(--muted)", fontSize: ".85rem" }}>{t.card.empty}</p>
  ) : (
    <div style={{ display: "grid", gap: "1px", background: "var(--border)" }}>
      {contents.map((content, i) => (
        <Fragment key={content.id}>
          <ContentCard content={content} locale={locale} />
          {(i + 1) % AD_INTERVAL === 0 && i < contents.length - 1 && (
            <div style={{ background: "#fff", display: "flow-root" }}>
              <InArticleAd />
            </div>
          )}
        </Fragment>
      ))}
    </div>
  )
}

export const Section: FC<{
  title: string
  description?: string
  // ページの主見出しとして使う場合はh1
  level?: 1 | 2
  children: ReactNode
}> = ({ title, description, level = 2, children }) => {
  const Heading = level === 1 ? "h1" : "h2"
  return (
    <section style={{ margin: "0 0 4rem" }}>
      <Heading
        style={{
          alignItems: "baseline",
          color: "var(--ink)",
          display: "flex",
          fontFamily: "var(--font-serif)",
          fontSize: "1.4rem",
          gap: ".75rem",
          letterSpacing: ".06em",
          margin: "0 0 1.5rem",
        }}
      >
        <span
          style={{
            background: "var(--accent)",
            height: "1px",
            width: "1.75rem",
          }}
        />
        {title}
      </Heading>
      {description && (
        <p
          style={{
            color: "var(--muted)",
            fontSize: ".85rem",
            margin: "-1rem 0 1.5rem",
          }}
        >
          {description}
        </p>
      )}
      {children}
    </section>
  )
}
