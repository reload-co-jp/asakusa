import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { FC } from "react"
import { ContentList, Section } from "@/components/elements/content"
import { getArea, getContentsByArea, getPlacesByArea } from "@/lib/data"
import { AREAS, PLACE_TYPES } from "@/lib/types"

export const generateStaticParams = () =>
  AREAS.map((area) => ({ slug: area.slug }))

export const dynamicParams = false

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> => {
  const { slug } = await params
  const area = getArea(slug)
  if (!area) return {}
  const title = `${area.name}エリアの情報 | 浅草ライブ`
  const description = `${area.name}エリアのイベント・新店舗・観光スポット情報一覧`
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
  }
}

const Page: FC<{ params: Promise<{ slug: string }> }> = async ({ params }) => {
  const { slug } = await params
  const area = getArea(slug)
  if (!area) notFound()
  const areaPlaces = getPlacesByArea(area.name)
  return (
    <>
      <Section title={`${area.name}の情報`}>
        <ContentList contents={getContentsByArea(area.name)} />
      </Section>
      <Section title={`${area.name}のスポット`}>
        {areaPlaces.length === 0 ? (
          <p style={{ color: "#999", fontSize: ".85rem" }}>
            現在情報はありません。
          </p>
        ) : (
          <ul
            style={{
              display: "grid",
              gap: ".5rem",
              listStyle: "none",
              padding: 0,
            }}
          >
            {areaPlaces.map((place) => (
              <li key={place.id}>
                <Link
                  href={`/place/${place.id}/`}
                  style={{ color: "#1a1a1a", fontSize: ".9rem" }}
                >
                  {place.name}
                </Link>
                <span
                  style={{
                    color: "#999",
                    fontSize: ".75rem",
                    marginLeft: ".5rem",
                  }}
                >
                  {PLACE_TYPES[place.type]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  )
}

export default Page
