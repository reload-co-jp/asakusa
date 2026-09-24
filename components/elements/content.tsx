import Image from "next/image"
import Link from "next/link"
import { FC, ReactNode } from "react"
import { getPlace } from "@/lib/data"
import { formatDate } from "@/lib/date"
import { CATEGORIES, Content } from "@/lib/types"

export const formatContentPeriod = (content: Content): string | null => {
  if (!content.start_at) return null
  if (!content.end_at || content.end_at === content.start_at)
    return formatDate(content.start_at)
  return `${formatDate(content.start_at)} 〜 ${formatDate(content.end_at)}`
}

// 画像altは内容を具体的に(施設名があれば「◯◯の」を付与)
export const contentImageAlt = (content: Content): string => {
  const place = content.place_id ? getPlace(content.place_id) : undefined
  return place && !content.title.includes(place.name)
    ? `${place.name}の${content.title}`
    : content.title
}

export const CategoryLabel: FC<{ category: Content["category"] }> = ({
  category,
}) => (
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
    {CATEGORIES[category]}
  </span>
)

export const ContentCard: FC<{ content: Content }> = ({ content }) => {
  const place = content.place_id ? getPlace(content.place_id) : undefined
  const period = formatContentPeriod(content)
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
          href={`/content/${content.id}/`}
          style={{ flexShrink: 0, overflow: "hidden", position: "relative" }}
        >
          <Image
            alt={contentImageAlt(content)}
            height={84}
            src={content.image_url}
            style={{ objectFit: "cover" }}
            width={112}
          />
        </Link>
      )}
      <div style={{ minWidth: 0 }}>
        <CategoryLabel category={content.category} />
        <h3
          style={{
            fontSize: "1.02rem",
            letterSpacing: ".01em",
            lineHeight: 1.5,
            margin: ".7rem 0 .5rem",
          }}
        >
          <Link
            href={`/content/${content.id}/`}
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
            ? `開催 ${period}`
            : `公開 ${formatDate(content.published_at)}`}
          {place ? `　${place.name}` : ""}
        </p>
      </div>
    </article>
  )
}

export const ContentList: FC<{ contents: Content[] }> = ({ contents }) =>
  contents.length === 0 ? (
    <p style={{ color: "var(--muted)", fontSize: ".85rem" }}>
      現在情報はありません。
    </p>
  ) : (
    <div style={{ display: "grid", gap: "1px", background: "var(--border)" }}>
      {contents.map((content) => (
        <ContentCard content={content} key={content.id} />
      ))}
    </div>
  )

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
