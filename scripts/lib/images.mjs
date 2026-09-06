// 画像抽出・取得の共通ロジック(fetch-source-images.mjs / fetch-contents.mjs 共用)
import { execFile } from "child_process"
import { promisify } from "util"

const execFileAsync = promisify(execFile)

export const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"

export const EXCLUDE_KEYWORDS = [
  "logo",
  "icon",
  "favicon",
  "btn",
  "button",
  "bt_",
  "menu",
  "nav",
  "arrow",
  "spacer",
  "blank",
  "pixel",
  "tel",
  "contact",
  "spmenu",
  "slider_start",
  "slider_stop",
  "close",
  "hamburger",
  "sns",
  "twitter",
  "facebook",
  "instagram",
  "taxfree",
  "unionpay",
  "toycard",
]

export const EXT_RANK = { jpg: 0, jpeg: 0, png: 1, webp: 1, gif: 2 }

export const extOf = (url) => {
  const m = url.split("?")[0].match(/\.([a-zA-Z0-9]+)$/)
  return m ? m[1].toLowerCase() : ""
}

export const hasExcludedKeyword = (url) => {
  const lower = url.toLowerCase()
  return EXCLUDE_KEYWORDS.some((kw) => lower.includes(kw))
}

// ファイル名に日付・記事番号らしき数字列があれば記事画像とみなす
export const looksLikeArticleImage = (url) => /\d{6,8}/.test(url.toLowerCase())

export const extractMetaImage = (html, baseUrl) => {
  const metaRe =
    /<meta[^>]+(?:property|name)=["'](?:og:image(?::secure_url)?|twitter:image(?::src)?)["'][^>]+content=["']([^"']+)["']/i
  const metaRe2 =
    /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image(?::secure_url)?|twitter:image(?::src)?)["']/i
  const m = html.match(metaRe) || html.match(metaRe2)
  if (!m || !m[1]) return null
  try {
    return new URL(m[1], baseUrl).toString()
  } catch {
    return null
  }
}

// html内の<img>候補を抽出する。altText付き(記事内容とのマッチングに利用)
export const extractImgCandidates = (html, baseUrl) => {
  const tagRe = /<img\b[^>]*>/gi
  const tags = html.match(tagRe) ?? []
  const candidates = []
  for (const tag of tags) {
    const srcM = tag.match(/\bsrc=["']([^"']+)["']/i)
    const lazyM = tag.match(
      /\b(?:data-src|data-original|data-lazy-src)=["']([^"']+)["']/i,
    )
    const raw =
      lazyM?.[1] ??
      (srcM?.[1] && !srcM[1].startsWith("data:") ? srcM[1] : null)
    if (!raw) continue
    const widthM = tag.match(/\bwidth=["']?(\d+)/i)
    const heightM = tag.match(/\bheight=["']?(\d+)/i)
    const width = widthM ? Number(widthM[1]) : null
    const height = heightM ? Number(heightM[1]) : null
    if (width !== null && width < 40) continue
    if (height !== null && height < 40) continue
    let abs
    try {
      abs = new URL(raw, baseUrl).toString()
    } catch {
      continue
    }
    const ext = extOf(abs)
    if (ext === "svg" || !ext) continue
    const altM = tag.match(/\balt=["']([^"']*)["']/i)
    candidates.push({
      url: abs,
      alt: altM?.[1]?.trim() ?? "",
      ext,
      excluded: hasExcludedKeyword(abs),
      isArticle: looksLikeArticleImage(abs),
    })
  }
  return candidates
}

export const pickFallback = (candidates) => {
  const rank = (c) =>
    (c.excluded ? 100 : 0) +
    (c.isArticle ? -50 : 0) +
    (EXT_RANK[c.ext] ?? 3)
  const sorted = [...candidates].sort((a, b) => rank(a) - rank(b))
  return sorted[0] ?? null
}

export const guessExt = (url, contentType) => {
  if (contentType?.includes("png")) return "png"
  if (contentType?.includes("webp")) return "webp"
  if (contentType?.includes("gif")) return "gif"
  if (contentType?.includes("jpeg") || contentType?.includes("jpg")) return "jpg"
  const e = extOf(url)
  return e || "jpg"
}

export const fetchWithRetry = async (url, opts, retries = 1) => {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fetch(url, opts)
    } catch (err) {
      if (i === retries) throw err
      await new Promise((r) => setTimeout(r, 1500))
    }
  }
}

// Node undici が失敗するサイト向けcurlフォールバック(テキスト取得)
export const curlText = async (url, ua) => {
  const { stdout } = await execFileAsync(
    "curl",
    ["-sL", "-A", ua, "-m", "15", url],
    { maxBuffer: 1024 * 1024 * 20 },
  )
  return stdout
}

// curlでバイナリ取得(画像ダウンロード用)
export const curlBinary = async (url, ua, referer) => {
  const { stdout } = await execFileAsync(
    "curl",
    ["-sL", "-A", ua, "-e", referer, "-m", "15", url],
    { maxBuffer: 1024 * 1024 * 20, encoding: "buffer" },
  )
  return stdout
}

// 画像URLをダウンロードしBufferで返す(fetch失敗時はcurlにフォールバック)
export const downloadImage = async (imageUrl, referer) => {
  try {
    const res = await fetchWithRetry(imageUrl, {
      headers: { "User-Agent": UA, Referer: referer },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return null
    return Buffer.from(await res.arrayBuffer())
  } catch {
    try {
      return await curlBinary(imageUrl, UA, referer)
    } catch {
      return null
    }
  }
}
