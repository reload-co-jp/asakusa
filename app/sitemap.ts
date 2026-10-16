import { MetadataRoute } from "next"
import {
  contents,
  getArchiveMonths,
  getContentsByArea,
  getContentsByCategory,
  getContentsByPlace,
  getGourmetPlaces,
  getLatestContents,
  getThemeEvents,
  isTranslated,
  places,
} from "@/lib/data"
import { HTML_LANG, Locale, LOCALES, localePath } from "@/lib/i18n-config"
import { SITE_URL } from "@/lib/json-ld"
import {
  AREAS,
  Area,
  CATEGORIES,
  Category,
  GOURMET_GENRES,
  GourmetGenre,
  Place,
  Theme,
  THEMES,
} from "@/lib/types"

export const dynamic = "force-static"

// 日付ページはビルド毎に内容が変わるため、ビルド時刻をlastModifiedに使う
const buildTime = new Date().toISOString()

// 一覧ページは掲載記事の最新公開日をlastModifiedにする(記事0件はnoindexのため除外)
// changeFrequency/priority はGoogleが無視するため付けない
const listPage = (url: string, items: { published_at: string }[]) =>
  items.length > 0 ? [{ url, lastModified: items[0].published_at }] : []

// url は日本語版のパスで書き、各言語版(hreflang付き)に展開する
// locales 省略時は全言語。未翻訳記事の翻訳版はnoindexのため除外する
type Page = { url: string; lastModified?: string; locales?: readonly Locale[] }

// 場所一覧は掲載場所の情報更新日の最新をlastModifiedにする
const latestUpdate = (items: Place[]) =>
  items
    .map((place) => place.updated_at)
    .sort()
    .at(-1)

const pages = (): Page[] => [
  ...[
    "/",
    "/events/",
    "/today/",
    "/this-week/",
    "/weekend/",
    "/next-week/",
    "/this-month/",
  ].map((url) => ({ url, lastModified: buildTime })),
  ...(Object.keys(THEMES) as Theme[])
    .filter((theme) => getThemeEvents(theme).length > 0)
    .map((theme) => ({ url: `/theme/${theme}/`, lastModified: buildTime })),
  ...getArchiveMonths().map(({ year, month }) => ({
    url: `/events/${year}/${month}/`,
  })),
  ...(Object.keys(CATEGORIES) as Category[]).flatMap((category) =>
    listPage(`/category/${category}/`, getContentsByCategory(category))
  ),
  ...listPage("/area/", getLatestContents()),
  ...(Object.keys(AREAS) as Area[]).flatMap((area) =>
    listPage(`/area/${area}/`, getContentsByArea(area))
  ),
  { url: "/place/", lastModified: latestUpdate(places) },
  {
    url: "/gourmet/",
    lastModified: latestUpdate(places.filter((place) => place.genre)),
  },
  ...(Object.keys(GOURMET_GENRES) as GourmetGenre[]).map((genre) => ({
    url: `/gourmet/${genre}/`,
    lastModified: latestUpdate(getGourmetPlaces(genre)),
  })),
  ...places.map((place) => ({
    url: `/place/${place.id}/`,
    // 記事公開日(YYYY-MM-DDTHH:mm…)と情報更新日(YYYY-MM-DD)の新しい方
    lastModified: [
      getContentsByPlace(place.id)[0]?.published_at,
      place.updated_at,
    ]
      .filter((date) => date != null)
      .sort()
      .at(-1),
  })),
  ...contents.map((content) => ({
    url: `/content/${content.id}/`,
    locales: LOCALES.filter((locale) => isTranslated(content, locale)),
    lastModified: content.published_at,
  })),
]

const sitemap = (): MetadataRoute.Sitemap =>
  pages().flatMap(({ locales = LOCALES, ...page }) =>
    locales.map((locale) => ({
      ...page,
      url: `${SITE_URL}${localePath(locale, page.url)}`,
      alternates: {
        languages: {
          ...Object.fromEntries(
            locales.map((l) => [
              HTML_LANG[l],
              `${SITE_URL}${localePath(l, page.url)}`,
            ])
          ),
          "x-default": `${SITE_URL}${page.url}`,
        },
      },
    }))
  )

export default sitemap
