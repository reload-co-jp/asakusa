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

// 画像なしの記事はスポット画像、それもなければ誌面風のplaceholderを表示する
export const Media: FC<{
  content: Content
  locale: Locale
  sizes: string
  className?: string
  priority?: boolean
  children?: ReactNode
}> = ({ content: original, locale, sizes, className, priority, children }) => {
  const { content, place } = localized(original, locale)
  const image = content.image_url ?? place?.image_url
  const small = image !== undefined && imageWidth(image) < 400
  return (
    <div
      className={`media${small ? " media--small" : ""}${className ? ` ${className}` : ""}`}
    >
      {image ? (
        <Image
          alt={
            content.image_url
              ? contentImageAlt(content, locale)
              : (place?.name ?? "")
          }
          fill
          priority={priority}
          sizes={sizes}
          src={image}
        />
      ) : (
        <span aria-hidden="true" className="placeholder">
          <span className="placeholder__mark">A.</span>
          <span className="placeholder__label">
            {DICTIONARIES[locale].categories[content.category]}
          </span>
        </span>
      )}
      {children}
    </div>
  )
}

export const cardDate = (content: Content): string | null => {
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
  // 低解像度画像は大判にせず、カード内でも引き伸ばさない
  const isFeature = feature && isLargeImage(content.image_url)
  return (
    <article className={`card${isFeature ? " card--feature" : ""}`}>
      <Media
        content={original}
        locale={locale}
        sizes={
          isFeature
            ? "(min-width: 720px) 50vw, 100vw"
            : "(min-width: 720px) 25vw, 100vw"
        }
      >
        <span className="card__badge">
          <StatusBadge content={original} locale={locale} />
        </span>
      </Media>
      <div className="card__body">
        <CategoryLabel category={content.category} locale={locale} />
        <h3 className="card__title">
          <Link href={href}>{content.title}</Link>
        </h3>
        {isFeature && <p className="card__summary">{content.summary}</p>}
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
const AD_INTERVAL = 4
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
    <Empty text={t.card.empty} />
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

const Empty: FC<{ text: string }> = ({ text }) => (
  <p className="empty">{text}</p>
)

// 日付を主役にしたイベント一覧(今日・今週)
export const EventList: FC<{ contents: Content[] }> = async ({ contents }) => {
  const { locale, t } = await getDictionary()
  if (contents.length === 0) return <Empty text={t.card.empty} />
  const today = jstDateString()
  return (
    <ol className="event-list">
      {contents.map((original, i) => {
        const { content, place } = localized(original, locale)
        const day = content.start_at ?? today
        return (
          <Fragment key={content.id}>
            <li className="event-row">
              <p aria-hidden="true" className="event-row__date">
                <span className="event-row__day">{formatShortDate(day)}</span>
                <span className="event-row__weekday">
                  {formatShortDate(day, true).slice(6)}
                </span>
              </p>
              <div className="event-row__body">
                <p className="event-row__meta">
                  <StatusBadge content={original} locale={locale} />
                  <CategoryLabel category={content.category} locale={locale} />
                </p>
                <h3 className="event-row__title">
                  <Link href={localePath(locale, `/content/${content.id}/`)}>
                    {content.title}
                  </Link>
                </h3>
                <p className="event-row__info">
                  <span className="card__date">{cardDate(content)}</span>
                  {place && <span>{place.name}</span>}
                </p>
              </div>
              <Media
                className="event-row__media"
                content={original}
                locale={locale}
                sizes="(min-width: 720px) 10rem, 6rem"
              />
            </li>
            {(i + 1) % AD_INTERVAL === 0 && i < contents.length - 1 && (
              <li className="ad-slot" style={{ display: "flow-root" }}>
                <InArticleAd />
              </li>
            )}
          </Fragment>
        )
      })}
    </ol>
  )
}

// 公開日と見出しで読ませるニュース一覧。compactはカテゴリー欄用
export const NewsList: FC<{ contents: Content[]; compact?: boolean }> = async ({
  contents,
  compact,
}) => {
  const { locale, t } = await getDictionary()
  if (contents.length === 0) return <Empty text={t.card.empty} />
  return (
    <ol className={`news-list${compact ? " news-list--compact" : ""}`}>
      {contents.map((original, i) => {
        const { content } = localized(original, locale)
        return (
          <Fragment key={content.id}>
            <li className="news-row">
              <Media
                className="news-row__media"
                content={original}
                locale={locale}
                sizes="(min-width: 720px) 12rem, 6rem"
              />
              <div className="news-row__body">
                <p className="news-row__meta">
                  <CategoryLabel category={content.category} locale={locale} />
                  <time dateTime={content.published_at}>
                    {formatDate(content.published_at, locale)}
                  </time>
                </p>
                <h3 className="news-row__title">
                  <Link href={localePath(locale, `/content/${content.id}/`)}>
                    {content.title}
                  </Link>
                </h3>
                {!compact && (
                  <p className="news-row__summary">{content.summary}</p>
                )}
              </div>
            </li>
            {!compact &&
              (i + 1) % AD_INTERVAL === 0 &&
              i < contents.length - 1 && (
                <li className="ad-slot" style={{ display: "flow-root" }}>
                  <InArticleAd />
                </li>
              )}
          </Fragment>
        )
      })}
    </ol>
  )
}

// トップの注目記事。大きな写真と余白で見せる
export const FeatureStory: FC<{ content: Content }> = async ({
  content: original,
}) => {
  const { locale, t } = await getDictionary()
  const { content, place } = localized(original, locale)
  const date = cardDate(content)
  return (
    <article className="feature">
      <Media
        className="feature__media"
        content={original}
        locale={locale}
        priority
        sizes="(min-width: 960px) 40vw, 100vw"
      >
        <span className="card__badge">
          <StatusBadge content={original} locale={locale} />
        </span>
      </Media>
      <div className="feature__body">
        <p className="feature__kicker">
          <span className="eyebrow">{t.home.featured}</span>
          <CategoryLabel category={content.category} locale={locale} />
        </p>
        <h2 className="feature__title">
          <Link href={localePath(locale, `/content/${content.id}/`)}>
            {content.title}
          </Link>
        </h2>
        <p className="feature__summary">{content.summary}</p>
        <p className="card__meta">
          {date ? (
            <span className="card__date">{date}</span>
          ) : (
            t.card.published(formatDate(content.published_at, locale))
          )}
          {place && <> · {place.name}</>}
        </p>
      </div>
    </article>
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
  // 見出し右の「すべて見る」リンク(言語プレフィックス付きで渡す)
  more?: { href: string; label: string }
  children: ReactNode
}> = ({ title, eyebrow, description, level = 2, id, more, children }) => {
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
        {more && (
          <Link className="more" href={more.href}>
            {more.label}
          </Link>
        )}
      </header>
      {children}
    </section>
  )
}
