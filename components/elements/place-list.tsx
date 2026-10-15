import Link from "next/link"
import { FC } from "react"
import { getPlaceContents, localizePlace } from "@/lib/data"
import { getDictionary, localePath } from "@/lib/i18n"
import { Place } from "@/lib/types"

export const PlaceList: FC<{ places: Place[] }> = async ({ places }) => {
  const { locale, t } = await getDictionary()
  return (
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
      {places.map((original) => {
        const place = localizePlace(original, locale)
        const { ongoing, upcoming } = getPlaceContents(place.id)
        const count = ongoing.length + upcoming.length
        return (
          <li
            key={place.id}
            style={{ background: "var(--surface)", padding: "1.25rem 1.5rem" }}
          >
            <span style={{ color: "var(--muted)", fontSize: ".72rem" }}>
              {place.genre
                ? t.gourmetGenres[place.genre]
                : t.placeTypes[place.type]}{" "}
              / {place.area}
            </span>
            <h2 style={{ fontSize: "1.02rem", margin: ".4rem 0" }}>
              <Link
                href={localePath(locale, `/place/${place.id}/`)}
                style={{ color: "var(--ink)", textDecoration: "none" }}
              >
                {place.name}
              </Link>
            </h2>
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
        )
      })}
    </ul>
  )
}
