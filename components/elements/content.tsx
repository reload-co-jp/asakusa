import Image from "next/image"
import Link from "next/link"
import { FC, ReactNode } from "react"
import { getPlace } from "@/lib/data"
import { CATEGORIES, Content } from "@/lib/types"

const formatDate = (date: string): string => {
  const [year, month, day] = date.split("-")
  return `${year}年${Number(month)}月${Number(day)}日`
}

const formatPeriod = (content: Content): string | null => {
  if (!content.start_at) return null
  if (!content.end_at || content.end_at === content.start_at)
    return formatDate(content.start_at)
  return `${formatDate(content.start_at)} 〜 ${formatDate(content.end_at)}`
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
  const period = formatPeriod(content)
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
            alt=""
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

export const Section: FC<{ title: string; children: ReactNode }> = ({
  title,
  children,
}) => (
  <section style={{ margin: "0 0 4rem" }}>
    <h2
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
        style={{ background: "var(--accent)", height: "1px", width: "1.75rem" }}
      />
      {title}
    </h2>
    {children}
  </section>
)
