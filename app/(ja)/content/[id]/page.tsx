import DOMPurify from "isomorphic-dompurify"
import { marked } from "marked"
import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { FC } from "react"
import { InArticleAd } from "@/components/elements/ad"
import { Breadcrumbs, Crumb, JsonLd } from "@/components/elements/breadcrumbs"
import {
  CategoryLabel,
  contentImageAlt,
  ContentList,
  formatContentPeriod,
  localized,
  Section,
} from "@/components/elements/content"
import {
  contents,
  getContent,
  getRelatedContents,
  getSource,
  isEnded,
  isTranslated,
} from "@/lib/data"
import { formatDate } from "@/lib/date"
import { alternates, getDictionary, localePath } from "@/lib/i18n"
import { SITE_URL } from "@/lib/json-ld"
import { EVENT_CATEGORIES } from "@/lib/types"

export const generateStaticParams = () =>
  contents.map((content) => ({ id: String(content.id) }))

export const dynamicParams = false

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> => {
  const { id } = await params
  const original = getContent(Number(id))
  if (!original) return {}
  const { locale, t } = await getDictionary()
  const { content } = localized(original, locale)
  const title = `${content.title}｜${t.siteName}`
  const path = `/content/${content.id}/`
  return {
    title,
    description: content.summary,
    alternates: alternates(locale, path),
    // 未翻訳(日本語のまま)の翻訳版ページは重複になるためインデックスさせない
    ...(!isTranslated(original, locale) && {
      robots: { index: false, follow: true },
    }),
    openGraph: {
      title,
      description: content.summary,
      url: localePath(locale, path),
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
  const original = getContent(Number(id))
  if (!original) notFound()
  const { locale, t } = await getDictionary()
  const { content, place } = localized(original, locale)
  const source = content.source_id ? getSource(content.source_id) : undefined
  const bodyHtml = DOMPurify.sanitize(
    marked.parse(content.body, { breaks: true }) as string
  )
  const url = `${SITE_URL}${localePath(locale, `/content/${content.id}/`)}`
  const categoryCrumb: Crumb = {
    name: t.categories[content.category],
    href: `/category/${content.category}/`,
  }
  const crumbs: Crumb[] = [
    ...(content.start_at || EVENT_CATEGORIES.includes(content.category)
      ? [{ name: t.nav.events, href: "/events/" }]
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
        articleSection: t.categories[content.category],
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
            alt={contentImageAlt(content, locale)}
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
        <CategoryLabel category={content.category} locale={locale} />
        {ended && (
          <span
            style={{
              color: "var(--muted)",
              fontSize: ".72rem",
              marginLeft: ".6rem",
            }}
          >
            {t.content.ended}
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
          {t.content.published(formatDate(content.published_at, locale))}
        </p>
        <div
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
          style={{
            color: "var(--ink-soft)",
            fontSize: ".95rem",
            lineHeight: 1.9,
          }}
        />
        <InArticleAd />
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
              label={t.content.period}
              value={formatContentPeriod(content, locale)}
            />
          )}
          {place && <InfoRow label={t.content.place} value={place.name} />}
          {place && <InfoRow label={t.content.address} value={place.address} />}
          {source && <InfoRow label={t.content.source} value={source.name} />}
        </ul>
        {place && (
          <p style={{ fontSize: ".85rem", margin: "1.5rem 0 0" }}>
            <Link
              href={localePath(locale, `/place/${place.id}/`)}
              style={{ color: "var(--accent)" }}
            >
              {t.content.placeLink(place.name)}
            </Link>
          </p>
        )}
        <p style={{ fontSize: ".85rem", margin: ".6rem 0 0" }}>
          <Link
            href={localePath(locale, categoryCrumb.href)}
            style={{ color: "var(--accent)" }}
          >
            {t.content.categoryLink(categoryCrumb.name)}
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
              {t.content.official}
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
              {t.content.official}
            </a>
          </p>
        ))}
      </article>
      {related.length > 0 && (
        <div style={{ margin: "4rem 0 0" }}>
          <Section title={t.content.related}>
            <ContentList contents={related} />
          </Section>
        </div>
      )}
    </>
  )
}

export default Page
