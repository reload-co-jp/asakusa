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
      border: "1px solid #8c3a3a",
      borderRadius: "1px",
      color: "#8c3a3a",
      display: "inline-block",
      fontSize: ".7rem",
      letterSpacing: ".03em",
      padding: ".1rem .5rem",
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
        backgroundColor: "#fff",
        border: "1px solid #e5e2dc",
        display: "flex",
        gap: "1.25rem",
        padding: "1.25rem",
      }}
    >
      {content.image_url && (
        <Link
          href={`/content/${content.id}/`}
          style={{ flexShrink: 0, position: "relative" }}
        >
          <Image
            alt=""
            height={80}
            src={content.image_url}
            style={{ objectFit: "cover" }}
            width={107}
          />
        </Link>
      )}
      <div style={{ minWidth: 0 }}>
        <CategoryLabel category={content.category} />
        <h3 style={{ fontSize: "1rem", margin: ".6rem 0" }}>
          <Link
            href={`/content/${content.id}/`}
            style={{ color: "#1a1a1a", textDecoration: "none" }}
          >
            {content.title}
          </Link>
        </h3>
        <p style={{ color: "#666", fontSize: ".85rem", margin: 0 }}>
          {content.summary}
        </p>
        <p style={{ color: "#999", fontSize: ".75rem", margin: ".5rem 0 0" }}>
          {period
            ? `開催: ${period}`
            : `公開: ${formatDate(content.published_at)}`}
          {place ? ` / ${place.name}` : ""}
        </p>
      </div>
    </article>
  )
}

export const ContentList: FC<{ contents: Content[] }> = ({ contents }) =>
  contents.length === 0 ? (
    <p style={{ color: "#999", fontSize: ".85rem" }}>現在情報はありません。</p>
  ) : (
    <div style={{ display: "grid", gap: "1rem" }}>
      {contents.map((content) => (
        <ContentCard content={content} key={content.id} />
      ))}
    </div>
  )

export const Section: FC<{ title: string; children: ReactNode }> = ({
  title,
  children,
}) => (
  <section style={{ margin: "0 0 3rem" }}>
    <h2
      style={{
        borderBottom: "2px solid #1a1a1a",
        color: "#1a1a1a",
        fontSize: "1.15rem",
        letterSpacing: ".03em",
        margin: "0 0 1.25rem",
        paddingBottom: ".6rem",
      }}
    >
      {title}
    </h2>
    {children}
  </section>
)
