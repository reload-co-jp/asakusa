import DOMPurify from "isomorphic-dompurify"
import { marked } from "marked"
import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { FC } from "react"
import { Breadcrumbs, Crumb, JsonLd } from "@/components/elements/breadcrumbs"
import {
  CategoryLabel,
  contentImageAlt,
  ContentList,
  Section,
} from "@/components/elements/content"
import {
  contents,
  getContent,
  getPlace,
  getRelatedContents,
  getSource,
  isEnded,
} from "@/lib/data"
import { formatDate } from "@/lib/date"
import { SITE_URL } from "@/lib/json-ld"
import { CATEGORIES, EVENT_CATEGORIES } from "@/lib/types"

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
  const title = `${content.title}｜浅草ライブ`
  const path = `/content/${content.id}/`
  return {
    title,
    description: content.summary,
    alternates: { canonical: path },
    openGraph: {
      title,
      description: content.summary,
      url: path,
      images: content.image_url ? [content.image_url] : undefined,
      type: "article",
    },
  }
}

const InfoRow: FC<{ label: string; value: string }> = ({ label, value }) => (
  <li style={{ display: "flex", fontSize: ".85rem", gap: ".5rem" }}>
    <span style={{ color: "var(--muted)", flexShrink: 0, width: "6rem" }}>
      {label}
    </span>
    <span style={{ color: "var(--ink-soft)" }}>{value}</span>
  </li>
)

const Page: FC<{ params: Promise<{ id: string }> }> = async ({ params }) => {
  const { id } = await params
  const content = getContent(Number(id))
  if (!content) notFound()
  const place = content.place_id ? getPlace(content.place_id) : undefined
  const source = content.source_id ? getSource(content.source_id) : undefined
  const bodyHtml = DOMPurify.sanitize(
    marked.parse(content.body, { breaks: true }) as string
  )
  const url = `${SITE_URL}/content/${content.id}/`
  const categoryCrumb: Crumb = {
    name: CATEGORIES[content.category],
    href: `/category/${content.category}/`,
  }
  const crumbs: Crumb[] = [
    ...(content.start_at || EVENT_CATEGORIES.includes(content.category)
      ? [{ name: "イベント", href: "/events/" }]
      : []),
    categoryCrumb,
    { name: content.title, href: `/content/${content.id}/` },
  ]
  const related = getRelatedContents(content)
  const ended = content.start_at !== null && isEnded(content)
  // ページ上に表示している情報のみ構造化データに含める
  const jsonLd = content.start_at
    ? {
        "@context": "https://schema.org",
        "@type": "Event",
        name: content.title,
        description: content.summary,
        startDate: content.start_at,
        ...(content.end_at && { endDate: content.end_at }),
        ...(content.image_url && { image: `${SITE_URL}${content.image_url}` }),
        url,
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
        ...(content.image_url && { image: `${SITE_URL}${content.image_url}` }),
        ...(source && {
          isBasedOn: source.url,
        }),
        mainEntityOfPage: url,
      }
  return (
    <>
      <Breadcrumbs items={crumbs} />
      <article>
        <JsonLd data={jsonLd} />
        {content.image_url && (
          <Image
            alt={contentImageAlt(content)}
            height={315}
            src={content.image_url}
            style={{
              aspectRatio: "800 / 315",
              height: "auto",
              margin: "0 0 1.5rem",
              objectFit: "cover",
              width: "100%",
            }}
            width={800}
          />
        )}
        <CategoryLabel category={content.category} />
        {ended && (
          <span
            style={{
              color: "var(--muted)",
              fontSize: ".72rem",
              marginLeft: ".6rem",
            }}
          >
            開催終了
          </span>
        )}
        <h1
          style={{
            color: "var(--ink)",
            fontFamily: "var(--font-serif)",
            fontSize: "1.5rem",
            letterSpacing: ".02em",
            lineHeight: 1.5,
            margin: ".9rem 0 .6rem",
          }}
        >
          {content.title}
        </h1>
        <p
          style={{
            color: "var(--muted)",
            fontSize: ".78rem",
            margin: "0 0 1.5rem",
          }}
        >
          {formatDate(content.published_at)} 公開
        </p>
        <div
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
          style={{
            color: "var(--ink-soft)",
            fontSize: ".95rem",
            lineHeight: 1.9,
          }}
        />
        <ul
          style={{
            background: "#fff",
            borderLeft: "2px solid var(--accent)",
            display: "grid",
            gap: ".6rem",
            listStyle: "none",
            margin: "2rem 0 0",
            padding: "1.25rem 1.5rem",
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
          <p style={{ fontSize: ".85rem", margin: "1.5rem 0 0" }}>
            <Link
              href={`/place/${place.id}/`}
              style={{ color: "var(--accent)" }}
            >
              {place.name}のイベント・施設情報を見る →
            </Link>
          </p>
        )}
        <p style={{ fontSize: ".85rem", margin: ".6rem 0 0" }}>
          <Link href={categoryCrumb.href} style={{ color: "var(--accent)" }}>
            浅草の{categoryCrumb.name}情報一覧 →
          </Link>
        </p>
        {content.source_url && (
          <p style={{ fontSize: ".85rem", margin: ".6rem 0 0" }}>
            <a
              href={content.source_url}
              rel="noreferrer"
              style={{ color: "var(--accent)" }}
              target="_blank"
            >
              公式情報を見る →
            </a>
          </p>
        )}
        {content.source_urls?.map((url) => (
          <p key={url} style={{ fontSize: ".85rem", margin: ".6rem 0 0" }}>
            <a
              href={url}
              rel="noreferrer"
              style={{ color: "var(--accent)" }}
              target="_blank"
            >
              公式情報を見る →
            </a>
          </p>
        ))}
      </article>
      {related.length > 0 && (
        <div style={{ margin: "4rem 0 0" }}>
          <Section title="関連する浅草の情報">
            <ContentList contents={related} />
          </Section>
        </div>
      )}
    </>
  )
}

export default Page
