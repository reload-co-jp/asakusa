import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { FC } from "react"
import { CategoryLabel } from "@/components/elements/content"
import { contents, getContent, getPlace, getSource } from "@/lib/data"
import { jsonLdToHtml, SITE_URL } from "@/lib/json-ld"
import { CATEGORIES } from "@/lib/types"

export const generateStaticParams = () =>
  contents.map((content) => ({ id: String(content.id) }))

export const dynamicParams = false

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> => {
  const { id } = await params
  const content = getContent(Number(id))
  if (!content) return {}
  const title = `${content.title} | 浅草ライブ`
  return {
    title,
    description: content.summary,
    openGraph: {
      title,
      description: content.summary,
      images: content.image_url ? [content.image_url] : undefined,
      type: "article",
    },
  }
}

const formatDate = (date: string): string => {
  const [year, month, day] = date.split("-")
  return `${year}年${Number(month)}月${Number(day)}日`
}

const InfoRow: FC<{ label: string; value: string }> = ({ label, value }) => (
  <li style={{ display: "flex", fontSize: ".85rem", gap: ".5rem" }}>
    <span style={{ color: "#999", flexShrink: 0, width: "6rem" }}>{label}</span>
    <span style={{ color: "#333" }}>{value}</span>
  </li>
)

const Page: FC<{ params: Promise<{ id: string }> }> = async ({ params }) => {
  const { id } = await params
  const content = getContent(Number(id))
  if (!content) notFound()
  const place = content.place_id ? getPlace(content.place_id) : undefined
  const source = content.source_id ? getSource(content.source_id) : undefined
  const jsonLd =
    content.start_at
      ? {
          "@context": "https://schema.org",
          "@type": "Event",
          name: content.title,
          description: content.summary,
          startDate: content.start_at,
          ...(content.end_at && { endDate: content.end_at }),
          ...(content.image_url && { image: content.image_url }),
          ...(place && {
            location: {
              "@type": "Place",
              name: place.name,
              address: place.address,
            },
          }),
        }
      : {
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          headline: content.title,
          description: content.summary,
          datePublished: content.published_at,
          articleSection: CATEGORIES[content.category],
          ...(content.image_url && { image: content.image_url }),
          ...(source && {
            isBasedOn: source.url,
          }),
          mainEntityOfPage: `${SITE_URL}/content/${content.id}/`,
        }
  return (
    <article>
      <script
        dangerouslySetInnerHTML={{ __html: jsonLdToHtml(jsonLd) }}
        type="application/ld+json"
      />
      {content.image_url && (
        <Image
          alt=""
          height={315}
          src={content.image_url}
          style={{
            height: "auto",
            margin: "0 0 1rem",
            width: "100%",
          }}
          width={800}
        />
      )}
      <CategoryLabel category={content.category} />
      <h2 style={{ color: "#1a1a1a", fontSize: "1.3rem", margin: ".6rem 0" }}>
        {content.title}
      </h2>
      <p style={{ color: "#999", fontSize: ".8rem", margin: "0 0 1rem" }}>
        {formatDate(content.published_at)} 公開
      </p>
      <p style={{ color: "#333", fontSize: ".95rem", lineHeight: 1.8 }}>
        {content.body}
      </p>
      <ul
        style={{
          backgroundColor: "#faf9f6",
          border: "1px solid #e5e2dc",
          display: "grid",
          gap: ".5rem",
          listStyle: "none",
          margin: "1.5rem 0 0",
          padding: "1rem",
        }}
      >
        {content.start_at && (
          <InfoRow
            label="開催期間"
            value={
              content.end_at && content.end_at !== content.start_at
                ? `${formatDate(content.start_at)} 〜 ${formatDate(content.end_at)}`
                : formatDate(content.start_at)
            }
          />
        )}
        {place && <InfoRow label="場所" value={place.name} />}
        {place && <InfoRow label="住所" value={place.address} />}
        {source && <InfoRow label="情報源" value={source.name} />}
      </ul>
      {place && (
        <p style={{ fontSize: ".85rem", margin: "1rem 0 0" }}>
          <Link href={`/place/${place.id}/`} style={{ color: "#8c3a3a" }}>
            {place.name}の詳細を見る
          </Link>
        </p>
      )}
      {content.source_url && (
        <p style={{ fontSize: ".85rem", margin: ".5rem 0 0" }}>
          <a
            href={content.source_url}
            rel="noreferrer"
            style={{ color: "#8c3a3a" }}
            target="_blank"
          >
            公式情報を見る
          </a>
        </p>
      )}
    </article>
  )
}

export default Page
