import { FC } from "react"

// 緯度経度 (latitude, longitude) を囲む OpenStreetMap 埋め込みの表示範囲
const LNG_SPAN = 0.003
const LAT_SPAN = 0.002

export const googleMapsUrl = (latitude: number, longitude: number) =>
  `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`

export const osmEmbedUrl = (latitude: number, longitude: number) => {
  const bbox = [
    longitude - LNG_SPAN,
    latitude - LAT_SPAN,
    longitude + LNG_SPAN,
    latitude + LAT_SPAN,
  ]
    .map((n) => n.toFixed(6))
    .join(",")
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude},${longitude}`
}

// 場所の地図（OpenStreetMap埋め込み＋Googleマップへのリンク）
export const PlaceMap: FC<{
  latitude: number
  longitude: number
  title: string
  linkLabel: string
}> = ({ latitude, longitude, title, linkLabel }) => (
  <>
    <iframe
      loading="lazy"
      src={osmEmbedUrl(latitude, longitude)}
      style={{
        aspectRatio: "4 / 3",
        border: 0,
        display: "block",
        margin: "1.5rem 0 0",
        width: "100%",
      }}
      title={title}
    />
    <p style={{ fontSize: ".85rem", margin: ".5rem 0 0" }}>
      <a
        href={googleMapsUrl(latitude, longitude)}
        rel="noreferrer"
        style={{ color: "var(--accent)" }}
        target="_blank"
      >
        {linkLabel}
      </a>
    </p>
  </>
)
