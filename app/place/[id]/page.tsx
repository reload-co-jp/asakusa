import Image from "next/image"
import { notFound } from "next/navigation"
import { FC } from "react"
import { ContentList, Section } from "@/components/elements/content"
import { getContentsByPlace, getPlace, places } from "@/lib/data"
import { PLACE_TYPES } from "@/lib/types"

export const generateStaticParams = () => places.map((place) => ({ id: place.id }))

export const dynamicParams = false

const InfoRow: FC<{ label: string; value: string }> = ({ label, value }) => (
  <li style={{ display: "flex", fontSize: ".85rem", gap: ".5rem" }}>
    <span style={{ color: "#999", flexShrink: 0, width: "6rem" }}>{label}</span>
    <span style={{ color: "#333" }}>{value}</span>
  </li>
)

const Page: FC<{ params: Promise<{ id: string }> }> = async ({ params }) => {
  const { id } = await params
  const place = getPlace(id)
  if (!place) notFound()
  return (
    <>
      <article style={{ margin: "0 0 2rem" }}>
        {place.image_url && (
          <Image
            alt=""
            height={315}
            src={place.image_url}
            style={{
              height: "auto",
              margin: "0 0 1rem",
              width: "100%",
            }}
            width={800}
          />
        )}
        <span style={{ color: "#999", fontSize: ".75rem" }}>
          {PLACE_TYPES[place.type]} / {place.area}
        </span>
        <h2 style={{ color: "#1a1a1a", fontSize: "1.3rem", margin: ".3rem 0 .75rem" }}>
          {place.name}
        </h2>
        <p style={{ color: "#333", fontSize: ".95rem", lineHeight: 1.8 }}>
          {place.description}
        </p>
        <ul
          style={{
            backgroundColor: "#faf9f6",
            border: "1px solid #e5e2dc",
            display: "grid",
            gap: ".5rem",
            listStyle: "none",
            margin: "1rem 0 0",
            padding: "1rem",
          }}
        >
          <InfoRow label="住所" value={place.address} />
          {place.opening_hours && (
            <InfoRow label="営業時間" value={place.opening_hours} />
          )}
          {place.phone && <InfoRow label="電話" value={place.phone} />}
        </ul>
        {place.url && (
          <p style={{ fontSize: ".85rem", margin: "1rem 0 0" }}>
            <a
              href={place.url}
              rel="noreferrer"
              style={{ color: "#8c3a3a" }}
              target="_blank"
            >
              公式サイト
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
