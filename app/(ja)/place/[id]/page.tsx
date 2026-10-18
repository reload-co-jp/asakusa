import { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"
import { FC } from "react"
import { InArticleAd } from "@/components/elements/ad"
import {
  Breadcrumbs,
  JsonLd,
  LinkList,
} from "@/components/elements/breadcrumbs"
import { ContentList, Section } from "@/components/elements/content"
import { getPlace, getPlaceContents, localizePlace, places } from "@/lib/data"
import { alternates, getDictionary, localePath } from "@/lib/i18n"
import { SITE_URL } from "@/lib/json-ld"
import { PlaceType } from "@/lib/types"

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
  restaurant: "Restaurant",
  other: "Place",
}

// 楽天アフィリエイトID。空なら周辺ホテルリンクを出さない
const RAKUTEN_AFFILIATE_ID = "589a7e53.27e6c7b2.589a7e54.37a5adb6"
const HOTELS_TARGET =
  "https://kw.travel.rakuten.co.jp/keyword/Search.do?charset=utf-8&f_query=" +
  encodeURIComponent("浅草")
const HOTELS_URL = `https://hb.afl.rakuten.co.jp/hgc/${RAKUTEN_AFFILIATE_ID}/?pc=${encodeURIComponent(HOTELS_TARGET)}&m=${encodeURIComponent(HOTELS_TARGET)}`

export const generateStaticParams = () =>
  places.map((place) => ({ id: place.id }))

export const dynamicParams = false

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> => {
  const { id } = await params
  const original = getPlace(id)
  if (!original) return {}
  const { locale, t } = await getDictionary()
  const place = localizePlace(original, locale)
  const title = place.genre
    ? t.gourmet.placeTitle(place.name, t.gourmetGenres[place.genre], place.area)
    : t.place.title(place.name, t.placeTypes[place.type], place.area)
  const { ongoing, upcoming } = getPlaceContents(place.id)
  const count = ongoing.length + upcoming.length
  const description = `${place.description}${
    count > 0 ? t.place.descriptionSuffix(count) : ""
  }`
  const path = `/place/${place.id}/`
  return {
    title,
    description,
    alternates: alternates(locale, path),
    openGraph: {
      title,
      description,
      url: localePath(locale, path),
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
  const original = getPlace(id)
  if (!original) notFound()
  const { locale, t } = await getDictionary()
  const place = localizePlace(original, locale)
  const { ongoing, upcoming, others } = getPlaceContents(place.id)
  const { latitude, longitude } = place
  const mapUrl =
    latitude != null && longitude != null
      ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
      : null
  const jsonLd = {
    "@context": "https://schema.org",
    // 飲食店以外のグルメスポット(和菓子・パン等)は FoodEstablishment
    "@type":
      place.genre && place.type !== "restaurant"
        ? "FoodEstablishment"
        : SCHEMA_TYPES[place.type],
    ...(place.genre && { servesCuisine: t.gourmetGenres[place.genre] }),
    "@id": `${SITE_URL}${localePath(locale, `/place/${place.id}/`)}`,
    name: place.name,
    description: place.description,
    address: {
      "@type": "PostalAddress",
      addressCountry: "JP",
      streetAddress: place.address,
    },
    ...(latitude != null &&
      longitude != null && {
        geo: { "@type": "GeoCoordinates", latitude, longitude },
      }),
    ...(mapUrl && { hasMap: mapUrl }),
    ...(place.phone && { telephone: place.phone }),
    ...(place.url && { url: place.url }),
    ...(place.image_url && { image: `${SITE_URL}${place.image_url}` }),
  }
  return (
    <>
      <Breadcrumbs
        items={[
          ...(place.genre
            ? [
                { name: t.nav.gourmet, href: "/gourmet/" },
                {
                  name: t.gourmetGenres[place.genre],
                  href: `/gourmet/${place.genre}/`,
                },
              ]
            : [{ name: t.nav.places, href: "/place/" }]),
          { name: place.name, href: `/place/${place.id}/` },
        ]}
      />
      <JsonLd data={jsonLd} />
      <article className="readable" style={{ margin: "0 0 2rem" }}>
        {place.image_url && (
          <Image
            alt={t.place.imageAlt(place.name)}
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
          {place.genre
            ? t.gourmetGenres[place.genre]
            : t.placeTypes[place.type]}{" "}
          / {place.area}
        </span>
        <h1
          style={{
            color: "var(--ink)",
            fontWeight: 800,
            fontSize: "clamp(1.6rem, 4vw, 2.2rem)",
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
            background: "var(--surface)",
            borderLeft: "2px solid var(--accent)",
            display: "grid",
            gap: ".6rem",
            listStyle: "none",
            margin: "1.5rem 0 0",
            padding: "1.25rem 1.5rem",
          }}
        >
          <InfoRow label={t.place.address} value={place.address} />
          {place.opening_hours && (
            <InfoRow label={t.place.hours} value={place.opening_hours} />
          )}
          {place.phone && <InfoRow label={t.place.phone} value={place.phone} />}
          <InfoRow label={t.place.updated} value={place.updated_at} />
        </ul>
        {place.url && (
          <p style={{ fontSize: ".85rem", margin: "1.5rem 0 0" }}>
            <a
              href={place.url}
              rel="noreferrer"
              style={{ color: "var(--accent)" }}
              target="_blank"
            >
              {t.place.official}
            </a>
          </p>
        )}
        {mapUrl && latitude != null && longitude != null && (
          <>
            <iframe
              loading="lazy"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${(
                longitude - 0.003
              ).toFixed(
                6
              )},${(latitude - 0.002).toFixed(6)},${(longitude + 0.003).toFixed(6)},${(
                latitude + 0.002
              ).toFixed(6)}&layer=mapnik&marker=${latitude},${longitude}`}
              style={{
                aspectRatio: "4 / 3",
                border: 0,
                display: "block",
                margin: "1.5rem 0 0",
                width: "100%",
              }}
              title={t.place.map(place.name)}
            />
            <p style={{ fontSize: ".85rem", margin: ".5rem 0 0" }}>
              <a
                href={mapUrl}
                rel="noreferrer"
                style={{ color: "var(--accent)" }}
                target="_blank"
              >
                {t.place.googleMaps}
              </a>
            </p>
          </>
        )}
        {RAKUTEN_AFFILIATE_ID && (
          <p style={{ fontSize: ".85rem", margin: ".5rem 0 0" }}>
            <a
              href={HOTELS_URL}
              rel="sponsored noreferrer"
              style={{ color: "var(--accent)" }}
              target="_blank"
            >
              {t.place.hotels}
            </a>
          </p>
        )}
      </article>
      <InArticleAd />
      {ongoing.length > 0 && (
        <Section title={t.place.ongoing(place.name)}>
          <ContentList contents={ongoing} />
        </Section>
      )}
      {upcoming.length > 0 && (
        <Section title={t.place.upcoming(place.name)}>
          <ContentList contents={upcoming} />
        </Section>
      )}
      {others.length > 0 && (
        <Section title={t.place.others(place.name)}>
          <ContentList contents={others} />
        </Section>
      )}
      <Section
        more={
          place.genre && {
            href: localePath(locale, "/gourmet/"),
            label: t.gourmet.viewAll,
          }
        }
        title={
          place.genre
            ? t.gourmet.sameGenre(t.gourmetGenres[place.genre])
            : t.place.otherPlaces
        }
      >
        <LinkList
          links={places
            .filter(
              (other) => other.id !== place.id && other.genre === place.genre
            )
            .map((other) => ({
              name: localizePlace(other, locale).name,
              href: `/place/${other.id}/`,
            }))}
        />
      </Section>
    </>
  )
}

export default Page
