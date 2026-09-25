import Image from "next/image"
import Link from "next/link"
import { FC } from "react"
import {
  CategoryLabel,
  contentImageAlt,
  formatContentPeriod,
} from "@/components/elements/content"
import { getPlace } from "@/lib/data"
import { addDays, jstDateString } from "@/lib/date"
import { Content } from "@/lib/types"

// 静的exportのため「開催中/明日から」はビルド時(JST)に確定する
const eventStatus = (content: Content, today: string): string => {
  const start = content.start_at ?? today
  if (start <= today) return "開催中"
  if (start === addDays(today, 1)) return "明日から"
  return "明後日から"
}

const CarouselCard: FC<{ content: Content; today: string }> = ({
  content,
  today,
}) => {
  const place = content.place_id ? getPlace(content.place_id) : undefined
  const period = formatContentPeriod(content)
  return (
    <li
      style={{
        background: "#fff",
        flex: "0 0 min(17rem, 80%)",
        listStyle: "none",
        scrollSnapAlign: "start",
      }}
    >
      <Link
        href={`/content/${content.id}/`}
        style={{
          color: "var(--ink)",
          display: "block",
          height: "100%",
          textDecoration: "none",
        }}
      >
        <div
          style={{
            aspectRatio: "4 / 3",
            background: "var(--accent-soft)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {content.image_url && (
            <Image
              alt={contentImageAlt(content)}
              fill
              sizes="17rem"
              src={content.image_url}
              style={{ objectFit: "cover" }}
            />
          )}
          <span
            style={{
              background: "var(--accent)",
              color: "#fff",
              fontSize: ".7rem",
              left: 0,
              letterSpacing: ".08em",
              padding: ".3rem .7rem",
              position: "absolute",
              top: 0,
            }}
          >
            {eventStatus(content, today)}
          </span>
        </div>
        <div style={{ padding: "1rem 1.1rem 1.2rem" }}>
          <CategoryLabel category={content.category} />
          <h3
            style={{
              fontSize: ".95rem",
              lineHeight: 1.5,
              margin: ".6rem 0 .4rem",
            }}
          >
            {content.title}
          </h3>
          <p
            style={{
              color: "var(--muted)",
              fontSize: ".72rem",
              letterSpacing: ".02em",
              margin: 0,
            }}
          >
            {period && `開催 ${period}`}
            {place ? `\u3000${place.name}` : ""}
          </p>
        </div>
      </Link>
    </li>
  )
}

// JS不要のCSS scroll-snapによる横スクロールカルーセル
export const EventCarousel: FC<{ contents: Content[]; now?: Date }> = ({
  contents,
  now = new Date(),
}) => {
  if (contents.length === 0) return null
  const today = jstDateString(now)
  return (
    <ul
      aria-label="開催中・近日開催のイベント"
      style={{
        display: "flex",
        gap: "1rem",
        margin: 0,
        overflowX: "auto",
        overscrollBehaviorX: "contain",
        padding: "0 0 1rem",
        scrollSnapType: "x mandatory",
        scrollbarWidth: "thin",
      }}
    >
      {contents.map((content) => (
        <CarouselCard content={content} key={content.id} today={today} />
      ))}
    </ul>
  )
}
