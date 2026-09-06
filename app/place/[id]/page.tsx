import { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"
import { FC } from "react"
import { ContentList, Section } from "@/components/elements/content"
import { getContentsByPlace, getPlace, places } from "@/lib/data"
import { jsonLdToHtml } from "@/lib/json-ld"
import { PLACE_TYPES } from "@/lib/types"

export const generateStaticParams = () => places.map((place) => ({ id: place.id }))

export const dynamicParams = false

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> => {
  const { id } = await params
  const place = getPlace(id)
  if (!place) return {}
  const title = `${place.name}（${PLACE_TYPES[place.type]}・${place.area}） | 浅草ライブ`
  return {
    title,
    description: place.description,
    openGraph: {
      title,
      description: place.description,
      images: place.image_url ? [place.image_url] : undefined,
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
  const place = getPlace(id)
  if (!place) notFound()
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: place.name,
    description: place.description,
    address: {
      "@type": "PostalAddress",
      addressLocality: place.area,
      streetAddress: place.address,
    },
    ...(place.latitude != null &&
      place.longitude != null && {
        geo: {
          "@type": "GeoCoordinates",
          latitude: place.latitude,
          longitude: place.longitude,
        },
      }),
    ...(place.phone && { telephone: place.phone }),
    ...(place.url && { url: place.url }),
    ...(place.image_url && { image: place.image_url }),
  }
  return (
    <>
      <script
        dangerouslySetInnerHTML={{ __html: jsonLdToHtml(jsonLd) }}
        type="application/ld+json"
      />
      <article style={{ margin: "0 0 2rem" }}>
        {place.image_url && (
          <Image
            alt=""
            height={315}
            src={place.image_url}
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
        <span
          style={{ color: "var(--muted)", fontSize: ".75rem", letterSpacing: ".04em" }}
        >
          {PLACE_TYPES[place.type]} / {place.area}
        </span>
        <h2
          style={{
            color: "var(--ink)",
            fontFamily: "var(--font-serif)",
            fontSize: "1.5rem",
            letterSpacing: ".02em",
            margin: ".5rem 0 1rem",
          }}
        >
          {place.name}
        </h2>
        <p style={{ color: "var(--ink-soft)", fontSize: ".95rem", lineHeight: 1.9 }}>
          {place.description}
        </p>
        <ul
          style={{
            background: "#fff",
            borderLeft: "2px solid var(--accent)",
            display: "grid",
            gap: ".6rem",
            listStyle: "none",
            margin: "1.5rem 0 0",
            padding: "1.25rem 1.5rem",
          }}
        >
          <InfoRow label="住所" value={place.address} />
          {place.opening_hours && (
            <InfoRow label="営業時間" value={place.opening_hours} />
          )}
          {place.phone && <InfoRow label="電話" value={place.phone} />}
        </ul>
        {place.url && (
          <p style={{ fontSize: ".85rem", margin: "1.5rem 0 0" }}>
            <a
              href={place.url}
              rel="noreferrer"
              style={{ color: "var(--accent)" }}
              target="_blank"
            >
              公式サイト →
            </a>
          </p>
        )}
      </article>
      <Section title={`${place.name}の情報`}>
        <ContentList contents={getContentsByPlace(place.id)} />
      </Section>
    </>
  )
}

export default Page
