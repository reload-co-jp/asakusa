// 食べログの店舗検索・店舗ページ取得(スポット画像の探索用)
import { UA, curlText, fetchWithRetry } from "./images.mjs"

// 食べログのエリアパス
export const AREA_PATHS = [
  {
    path: "/tokyo/A1311/A131102",
    areas: ["浅草", "雷門", "初音小路", "ホッピー通り", "ひさご通り"],
  },
  { path: "/tokyo/A1311/A131103", areas: ["蔵前", "浅草橋"] },
  { path: "/tokyo/A1312/A131203", areas: ["押上", "向島", "曳舟"] },
]

const HEADERS = {
  "User-Agent": UA,
  "Accept-Language": "ja,en;q=0.8",
  Accept: "text/html,application/xhtml+xml",
}

const getText = async (url) => {
  try {
    const res = await fetchWithRetry(url, {
      headers: HEADERS,
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return ""
    return await res.text()
  } catch {
    return curlText(url, UA).catch(() => "")
  }
}

// 空白・括弧・記号・全角半角の違いを無視して比較するための正規化
export const normalizeName = (name) =>
  name
    .normalize("NFKC")
    .replace(/[\s\p{P}\p{S}]/gu, "")
    .toLowerCase()

// エリア名・業種名・支店名を取り除いた店名の核心部分
export const coreName = (name) =>
  name
    .replace(
      /(大衆酒場|酒場|居酒屋|食堂|焼肉|もんじゃ|お好み焼き?|鉄板焼|喫茶|カフェ|バー)/g,
      " "
    )
    .replace(
      /(浅草|蔵前|田原町|稲荷町|浅草橋|押上|雷門|初音小路|ホッピー通り|ひさご通り|本店|支店|店)/g,
      " "
    )
    .replace(/\s+/g, " ")
    .trim()

// bigramのJaccard係数(0〜1)
export const nameSimilarity = (a, b) => {
  const A = new Set()
  const B = new Set()
  for (let i = 0; i < a.length - 1; i++) A.add(a.slice(i, i + 2))
  for (let i = 0; i < b.length - 1; i++) B.add(b.slice(i, i + 2))
  if (A.size === 0 || B.size === 0) return 0
  let inter = 0
  for (const x of A) if (B.has(x)) inter++
  return (inter * 2) / (A.size + B.size)
}

// 2つの名称の一致度(0〜1)
const pairScore = (a, b) => {
  if (!a || !b) return 0
  if (a === b) return 1
  // 一方が他方を含む(大衆酒場 岡本 浅草本店 / 岡本 浅草本店 など)
  if (Math.min(a.length, b.length) >= 2 && (a.includes(b) || b.includes(a))) {
    return 0.85
  }
  return nameSimilarity(a, b)
}

// 店舗名とプレートの名称の一致度(0〜1)。
// 正式名称と核心部分(エリア名・業種名を除いた名称)の双方で比較し、大きい方を採用する
export const nameScore = (placeName, shopName) => {
  const variants = (name) =>
    [normalizeName(name), normalizeName(coreName(name))].filter(Boolean)
  let best = 0
  for (const a of variants(placeName)) {
    for (const b of variants(shopName)) {
      best = Math.max(best, pairScore(a, b))
    }
  }
  return best
}

// 検索キーワード候補(正式名称そのままと、種別語・エリア名を除いた名称)
export const keywordCandidates = (name) => {
  const keywords = [name]
  const stripped = name
    .replace(
      /(大衆酒場|酒場|居酒屋|食堂|焼肉|もんじゃ|お好み焼き|喫茶|カフェ|バー)/g,
      " "
    )
    .replace(/\s+/g, " ")
    .trim()
  if (stripped && stripped !== name) keywords.push(stripped)
  // エリア名・支店名を除いた名称(「浅草 つる次郎 本店」→「つる次郎」)
  const core = name
    .replace(
      /(浅草|蔵前|田原町|稲荷町|浅草橋|押上|雷門|初音小路|ホッピー通り|ひさご通り|本店|支店|店)/g,
      " "
    )
    .replace(/\s+/g, " ")
    .trim()
  if (core && !keywords.includes(core)) keywords.push(core)
  return [...new Set(keywords)]
}

// 店舗検索。店名と詳細URLのリストを返す
export const searchShops = async (keyword, areaPath) => {
  const url = `https://tabelog.com${areaPath}/rstLst/?sw=${encodeURIComponent(keyword)}`
  const html = await getText(url)
  if (!html) return []
  const shops = []
  const seen = new Set()
  const re =
    /<h3 class="list-rst__rst-name">\s*<a[^>]*href="(https:\/\/tabelog\.com[^"]+)"[^>]*>([^<]+)<\/a>/g
  let match
  while ((match = re.exec(html)) !== null) {
    const [, shopUrl, shopName] = match
    if (seen.has(shopUrl)) continue
    seen.add(shopUrl)
    shops.push({ url: shopUrl, name: shopName.trim() })
  }
  return shops
}

// 店舗ページからJSON-LD(名称・住所・緯度経度・代表画像)を取得
export const fetchShop = async (url) => {
  const html = await getText(url)
  if (!html) return null
  const match = html.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/
  )
  if (!match) return null
  let data
  try {
    data = JSON.parse(match[1])
  } catch {
    return null
  }
  const shop = Array.isArray(data) ? data[0] : data
  if (!shop || typeof shop !== "object") return null
  const ogImage = html.match(
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i
  )?.[1]
  return {
    url,
    name: shop.name ?? "",
    address: shop.address?.streetAddress ?? "",
    latitude: shop.geo?.latitude ?? null,
    longitude: shop.geo?.longitude ?? null,
    image: shop.image ?? null,
    ogImage: ogImage ? new URL(ogImage, url).toString() : null,
  }
}

// 店舗代表画像の候補(縦横比を保ったもの→正方形クロップ→元画像 の順)
export const imageCandidates = (shop) => {
  const candidates = []
  if (shop.image) candidates.push(shop.image)
  if (shop.ogImage) {
    candidates.push(shop.ogImage)
    // リサイズ前の元画像(同じ写真の拡大版が取れる)
    const original = shop.ogImage
      .replace(
        /^https:\/\/tblg\.k-img\.com\/resize\/[^/]+\//,
        "https://tblg.k-img.com/"
      )
      .replace(/\?.*$/, "")
    if (original !== shop.ogImage) candidates.push(original)
  }
  return [...new Set(candidates)]
}
