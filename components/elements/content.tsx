import Image from "next/image"
import Link from "next/link"
import { FC, Fragment, ReactNode } from "react"
import { InArticleAd } from "@/components/elements/ad"
import { imageWidth, isLargeImage } from "@/lib/image-size"
import { getPlace, localizeContent, localizePlace } from "@/lib/data"
import { addDays, formatDate, formatShortDate, jstDateString } from "@/lib/date"
import { DICTIONARIES, getDictionary, Locale, localePath } from "@/lib/i18n"
import { Content } from "@/lib/types"

export const formatContentPeriod = (
  content: Content,
  locale: Locale
): string | null => {
  if (!content.start_at) return null
  if (!content.end_at || content.end_at === content.start_at)
    return formatDate(content.start_at, locale)
  return `${formatDate(content.start_at, locale)} 〜 ${formatDate(content.end_at, locale)}`
}

// 翻訳済みのcontentと施設を返す
export const localized = (content: Content, locale: Locale) => {
  const place = content.place_id ? getPlace(content.place_id) : undefined
  return {
    content: localizeContent(content, locale),
    place: place && localizePlace(place, locale),
  }
}

// 画像altは内容を具体的に(施設名があれば「◯◯の」を付与)。contentは翻訳済みを渡す
export const contentImageAlt = (content: Content, locale: Locale): string => {
  const place = content.place_id ? getPlace(content.place_id) : undefined
  const name = place && localizePlace(place, locale).name
  return name && !content.title.includes(name)
    ? DICTIONARIES[locale].imageAlt(name, content.title)
    : content.title
}

export const CategoryLabel: FC<{
  category: Content["category"]
  locale: Locale
}> = ({ category, locale }) => (
  <span className="label">{DICTIONARIES[locale].categories[category]}</span>
)

// 静的exportのためステータスはビルド時(JST)に確定し、毎日のスケジュールビルドで更新する
export const eventStatus = (
  content: Content,
  today: string,
  locale: Locale
): { text: string; live?: boolean; urgent?: boolean } | null => {
  const t = DICTIONARIES[locale].carousel
  if (!content.start_at) return null
  const end = content.end_at ?? content.start_at
  if (end < today) return null
  if (content.start_at > today) {
    if (content.start_at === addDays(today, 1)) return { text: t.tomorrow }
    if (content.start_at === addDays(today, 2)) return { text: t.dayAfter }
    return null
  }
  if (content.start_at === end) return { text: t.today, live: true }
  if (end === today) return { text: t.endsToday, urgent: true }
  if (end === addDays(today, 1)) return { text: t.endsTomorrow, urgent: true }
  for (let days = 2; days <= 3; days++)
    if (end === addDays(today, days))
      return { text: t.daysLeft(days), live: true }
  return { text: t.ongoing, live: true }
}

export const StatusBadge: FC<{ content: Content; locale: Locale }> = ({
  content,
  locale,
}) => {
  const status = eventStatus(content, jstDateString(), locale)
  if (!status) return null
  const variant = status.urgent ? "urgent" : status.live ? "live" : ""
  return (
    <span className={`badge${variant ? ` badge--${variant}` : ""}`}>
      {status.text}
    </span>
  )
}

const cardDate = (content: Content): string | null => {
  if (!content.start_at) return null
  const start = formatShortDate(content.start_at, true)
  return !content.end_at || content.end_at === content.start_at
    ? start
    : `${start} → ${formatShortDate(content.end_at, true)}`
}

export const ContentCard: FC<{
  content: Content
  locale: Locale
  feature?: boolean
}> = ({ content: original, locale, feature }) => {
  const { content, place } = localized(original, locale)
  const t = DICTIONARIES[locale]
  const href = localePath(locale, `/content/${content.id}/`)
  const date = cardDate(content)
  // 画像なしの記事はスポット画像、それもなければブランド画像をplaceholderにする
  const image =
    content.image_url ?? place?.image_url ?? "/images/brand.jpeg"
  // 低解像度画像は大判にせず、カード内でも引き伸ばさない
  const isFeature = feature && isLargeImage(content.image_url)
  const small = imageWidth(image) < 400
  return (
    <article className={`card${isFeature ? " card--feature" : ""}`}>
      <div className={`card__media${small ? " card__media--small" : ""}`}>
        <Image
          alt={
            content.image_url
              ? contentImageAlt(content, locale)
              : (place?.image_url && place.name) || ""
          }
          fill
          sizes={
            isFeature
              ? "(min-width: 720px) 50vw, 100vw"
              : "(min-width: 720px) 25vw, 100vw"
          }
          src={image}
        />
        <span className="card__badge">
          <StatusBadge content={original} locale={locale} />
        </span>
      </div>
      <div className="card__body">
        <CategoryLabel category={content.category} locale={locale} />
        <h3 className="card__title">
          <Link href={href}>{content.title}</Link>
        </h3>
        {isFeature && (
          <p className="card__summary">{content.summary}</p>
        )}
        <p className="card__meta">
          {date ? (
            <span className="card__date">{date}</span>
          ) : (
            t.card.published(formatDate(content.published_at, locale))
          )}
          {place && (
            <>
              <br />
              {place.name}
            </>
          )}
          <span aria-hidden="true" className="card__arrow">
            →
          </span>
        </p>
      </div>
    </article>
  )
}

// 一覧の途中に広告を挟む間隔（件数）
const AD_INTERVAL = 6
// 大きく見せるカードの間隔（件数）
const FEATURE_INTERVAL = 7

export const ContentList: FC<{ contents: Content[] }> = async ({
  contents,
}) => {
  const { locale, t } = await getDictionary()
  // 区間ごとに最初の高解像度画像の記事を大きく見せる
  const featured = new Set<number>()
  let next = 0
  if (contents.length >= 4)
    contents.forEach((content, i) => {
      if (i >= next && isLargeImage(content.image_url)) {
        featured.add(i)
        next = i + FEATURE_INTERVAL
      }
    })
  return contents.length === 0 ? (
    <p style={{ color: "var(--muted)", fontSize: ".9rem" }}>{t.card.empty}</p>
  ) : (
    <div className="card-grid">
      {contents.map((content, i) => (
        <Fragment key={content.id}>
          <ContentCard
            content={content}
            feature={featured.has(i)}
            locale={locale}
          />
          {(i + 1) % AD_INTERVAL === 0 && i < contents.length - 1 && (
            <div className="ad-slot" style={{ display: "flow-root" }}>
              <InArticleAd />
            </div>
          )}
        </Fragment>
      ))}
    </div>
  )
}

export const Section: FC<{
  title: string
  // 英字の小見出し(装飾)
  eyebrow?: string
  description?: ReactNode
  // ページの主見出しとして使う場合はh1
  level?: 1 | 2
  id?: string
  children: ReactNode
}> = ({ title, eyebrow, description, level = 2, id, children }) => {
  const Heading = level === 1 ? "h1" : "h2"
  return (
    <section className="section" id={id}>
      <header className="section__head">
        {eyebrow && (
          <span aria-hidden="true" className="section__eyebrow">
            {eyebrow}
          </span>
        )}
        <Heading className="section__title">{title}</Heading>
        {description && <p className="section__lead">{description}</p>}
      </header>
      {children}
    </section>
  )
}
