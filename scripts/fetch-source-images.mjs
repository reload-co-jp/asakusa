// ソース公式サイトからog:image等を取得しローカル保存
import { writeFileSync, mkdirSync } from "fs"
import { fileURLToPath } from "url"
import path from "path"
import { execFile } from "child_process"
import { promisify } from "util"

const execFileAsync = promisify(execFile)

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, "..")
const outDir = path.join(root, "public/images/sources")
mkdirSync(outDir, { recursive: true })

const sources = JSON.parse(
  (await import("fs")).readFileSync(path.join(root, "data/sources.json"), "utf-8"),
)

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"

const EXCLUDE_KEYWORDS = [
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

const EXT_RANK = { jpg: 0, jpeg: 0, png: 1, webp: 1, gif: 2 }

const extOf = (url) => {
  const m = url.split("?")[0].match(/\.([a-zA-Z0-9]+)$/)
  return m ? m[1].toLowerCase() : ""
}

const hasExcludedKeyword = (url) => {
  const lower = url.toLowerCase()
  return EXCLUDE_KEYWORDS.some((kw) => lower.includes(kw))
}

// ファイル名に日付・記事番号らしき数字列 or thumb/news 等があれば記事画像とみなす
const looksLikeArticleImage = (url) => /\d{6,8}/.test(url.toLowerCase())

const extractMetaImage = (html, baseUrl) => {
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

const extractImgCandidates = (html, baseUrl) => {
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
    candidates.push({
      url: abs,
      ext,
      excluded: hasExcludedKeyword(abs),
      isArticle: looksLikeArticleImage(abs),
    })
  }
  return candidates
}

const pickFallback = (candidates) => {
  const rank = (c) =>
    (c.excluded ? 100 : 0) +
    (c.isArticle ? -50 : 0) +
    (EXT_RANK[c.ext] ?? 3)
  const sorted = [...candidates].sort((a, b) => rank(a) - rank(b))
  return sorted[0] ?? null
}

const guessExt = (url, contentType) => {
  if (contentType?.includes("png")) return "png"
  if (contentType?.includes("webp")) return "webp"
  if (contentType?.includes("gif")) return "gif"
  if (contentType?.includes("jpeg") || contentType?.includes("jpg")) return "jpg"
  const e = extOf(url)
  return e || "jpg"
}

const fetchWithRetry = async (url, opts, retries = 1) => {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fetch(url, opts)
    } catch (err) {
      if (i === retries) throw err
      await new Promise((r) => setTimeout(r, 1500))
    }
  }
}

// Node undici が失敗するサイト向けcurlフォールバック（テキスト取得）
const curlText = async (url, ua) => {
  const { stdout } = await execFileAsync(
    "curl",
    ["-sL", "-A", ua, "-m", "15", url],
    { maxBuffer: 1024 * 1024 * 20 },
  )
  return stdout
}

// curlでバイナリ取得（画像ダウンロード用）
const curlBinary = async (url, ua, referer) => {
  const { stdout } = await execFileAsync(
    "curl",
    ["-sL", "-A", ua, "-e", referer, "-m", "15", url],
    { maxBuffer: 1024 * 1024 * 20, encoding: "buffer" },
  )
  return stdout
}

const results = []

for (const source of sources) {
  const row = { id: source.id, url: source.url, status: "skip" }
  try {
    let html, finalUrl
    try {
      const res = await fetchWithRetry(source.url, {
        headers: { "User-Agent": UA, "Accept-Language": "ja,en;q=0.8" },
        redirect: "follow",
        signal: AbortSignal.timeout(15000),
      })
      if (!res.ok) {
        row.status = `page_error_${res.status}`
        results.push(row)
        continue
      }
      html = await res.text()
      finalUrl = res.url
    } catch {
      html = await curlText(source.url, UA)
      finalUrl = source.url
    }

    let imageUrl = extractMetaImage(html, finalUrl)
    let via = "og:image"
    if (imageUrl && (extOf(imageUrl) === "svg" || hasExcludedKeyword(imageUrl))) {
      imageUrl = null
    }
    if (!imageUrl) {
      const candidates = extractImgCandidates(html, finalUrl)
      const picked = pickFallback(candidates)
      if (picked) {
        imageUrl = picked.url
        via = picked.excluded ? "fallback:logo" : "fallback:img"
      }
    }
    if (!imageUrl) {
      row.status = "no_image_found"
      results.push(row)
      continue
    }

    let buf
    try {
      const imgRes = await fetchWithRetry(imageUrl, {
        headers: { "User-Agent": UA, Referer: source.url },
        signal: AbortSignal.timeout(15000),
      })
      if (!imgRes.ok) {
        row.status = `image_error_${imgRes.status}`
        row.imageUrl = imageUrl
        results.push(row)
        continue
      }
      buf = Buffer.from(await imgRes.arrayBuffer())
    } catch {
      buf = await curlBinary(imageUrl, UA, source.url)
    }

    if (!buf || buf.length < 2000) {
      row.status = "image_too_small"
      row.imageUrl = imageUrl
      results.push(row)
      continue
    }
    const ext = guessExt(imageUrl, null)
    const outPath = path.join(outDir, `${source.id}.${ext}`)
    writeFileSync(outPath, buf)
    row.status = `ok:${via}`
    row.imageUrl = imageUrl
    row.file = `/images/sources/${source.id}.${ext}`
    row.bytes = buf.length
  } catch (err) {
    row.status = `exception:${err.message}`
  }
  results.push(row)
}

writeFileSync(
  path.join(root, "scripts/fetch-source-images.result.json"),
  JSON.stringify(results, null, 2),
)

for (const r of results) {
  console.log(
    `${r.status.padEnd(20)} ${r.id.padEnd(14)} ${r.file ?? r.imageUrl ?? ""}`,
  )
}
