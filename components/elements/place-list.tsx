import Link from "next/link"
import { FC, Fragment } from "react"
import { InArticleAd } from "@/components/elements/ad"
import { AD_INTERVAL } from "@/components/elements/content"
import { getPlaceContents, localizePlace } from "@/lib/data"
import { getDictionary, localePath } from "@/lib/i18n"
import { JsonLd } from "@/components/elements/breadcrumbs"
import { SITE_URL } from "@/lib/json-ld"
import { Place } from "@/lib/types"

export const PlaceList: FC<{
  places: Place[]
  // ジャンル見出し(h2)の下に置く場合はh3
  headingLevel?: 2 | 3
}> = async ({ places, headingLevel = 2 }) => {
  const { locale, t } = await getDictionary()
  const Heading = headingLevel === 2 ? "h2" : "h3"
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: places.map((place, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: `${SITE_URL}${localePath(locale, `/place/${place.id}/`)}`,
          })),
        }}
      />
      <ul
        style={{
          display: "grid",
          gap: "1px",
          background: "var(--border)",
          listStyle: "none",
          margin: 0,
          padding: 0,
        }}
      >
        {places.map((original, i) => {
          const place = localizePlace(original, locale)
          const { ongoing, upcoming } = getPlaceContents(place.id)
          const count = ongoing.length + upcoming.length
          return (
            <Fragment key={place.id}>
              <li
                style={{
                  background: "var(--surface)",
                  padding: "1.25rem 1.5rem",
                }}
              >
                <span style={{ color: "var(--muted)", fontSize: ".72rem" }}>
                  {place.genre
                    ? t.gourmetGenres[place.genre]
                    : t.placeTypes[place.type]}{" "}
                  / {place.area}
                </span>
                <Heading style={{ fontSize: "1.02rem", margin: ".4rem 0" }}>
                  <Link
                    href={localePath(locale, `/place/${place.id}/`)}
                    style={{ color: "var(--ink)", textDecoration: "none" }}
                  >
                    {place.name}
                  </Link>
                </Heading>
                <p
                  style={{
                    color: "var(--ink-soft)",
                    fontSize: ".85rem",
                    margin: 0,
                  }}
                >
                  {place.description}
                </p>
                {count > 0 && (
                  <p
                    style={{
                      color: "var(--accent)",
                      fontSize: ".75rem",
                      margin: ".5rem 0 0",
                    }}
                  >
                    {t.place.eventCount(count)}
                  </p>
                )}
              </li>
              {(i + 1) % AD_INTERVAL === 0 && i < places.length - 1 && (
                <li className="ad-slot" style={{ display: "flow-root" }}>
                  <InArticleAd />
                </li>
              )}
            </Fragment>
          )
        })}
      </ul>
    </>
  )
}
