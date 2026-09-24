import { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"
import { FC } from "react"
import {
  Breadcrumbs,
  JsonLd,
  LinkList,
} from "@/components/elements/breadcrumbs"
import { ContentList, Section } from "@/components/elements/content"
import { getPlace, getPlaceContents, places } from "@/lib/data"
import { SITE_URL } from "@/lib/json-ld"
import { PLACE_TYPES, PlaceType } from "@/lib/types"

// 施設種別ごとのSchema.org型。汎用施設(商業施設・遊園地等)は種別から判別できないためPlace
const SCHEMA_TYPES: Record<PlaceType, string> = {
  store: "Store",
  facility: "Place",
  temple: "BuddhistTemple",
  shrine: "PlaceOfWorship",
  museum: "Museum",
  theater: "PerformingArtsTheater",
  park: "Park",
  tourist_spot: "TouristAttraction",
  other: "Place",
}

export const generateStaticParams = () =>
  places.map((place) => ({ id: place.id }))

export const dynamicParams = false

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> => {
  const { id } = await params
  const place = getPlace(id)
  if (!place) return {}
  const title = `${place.name}のイベント・最新情報｜${PLACE_TYPES[place.type]}・${place.area}｜浅草ライブ`
  const { ongoing, upcoming } = getPlaceContents(place.id)
  const description = `${place.description}${
    ongoing.length + upcoming.length > 0
      ? ` 開催中・今後のイベント${ongoing.length + upcoming.length}件を掲載。`
      : ""
  }`
  return {
    title,
    description,
    alternates: { canonical: `/place/${place.id}/` },
    openGraph: {
      title,
      description,
      url: `/place/${place.id}/`,
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
  const { ongoing, upcoming, others } = getPlaceContents(place.id)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": SCHEMA_TYPES[place.type],
    "@id": `${SITE_URL}/place/${place.id}/`,
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
    ...(place.image_url && { image: `${SITE_URL}${place.image_url}` }),
  }
  return (
    <>
      <Breadcrumbs
        items={[
          { name: "施設", href: "/place/" },
          { name: place.name, href: `/place/${place.id}/` },
        ]}
      />
      <JsonLd data={jsonLd} />
      <article style={{ margin: "0 0 2rem" }}>
        {place.image_url && (
          <Image
            alt={`${place.name}の外観`}
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
          style={{
            color: "var(--muted)",
            fontSize: ".75rem",
            letterSpacing: ".04em",
          }}
        >
          {PLACE_TYPES[place.type]} / {place.area}
        </span>
        <h1
          style={{
            color: "var(--ink)",
            fontFamily: "var(--font-serif)",
            fontSize: "1.5rem",
            letterSpacing: ".02em",
            margin: ".5rem 0 1rem",
          }}
        >
          {place.name}
        </h1>
        <p
          style={{
            color: "var(--ink-soft)",
            fontSize: ".95rem",
            lineHeight: 1.9,
          }}
        >
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
      {ongoing.length > 0 && (
        <Section title={`${place.name}で開催中のイベント`}>
          <ContentList contents={ongoing} />
        </Section>
      )}
      {upcoming.length > 0 && (
        <Section title={`${place.name}の今後のイベント・行事`}>
          <ContentList contents={upcoming} />
        </Section>
      )}
      {others.length > 0 && (
        <Section title={`${place.name}の関連ニュース・過去のイベント`}>
          <ContentList contents={others} />
        </Section>
      )}
      <Section title="浅草のほかの施設">
        <LinkList
          links={places
            .filter((other) => other.id !== place.id)
            .map((other) => ({
              name: other.name,
              href: `/place/${other.id}/`,
            }))}
        />
      </Section>
    </>
  )
}

export default Page
