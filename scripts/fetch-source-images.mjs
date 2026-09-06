// ソース公式サイトからog:image等を取得しローカル保存
import { writeFileSync, mkdirSync } from "fs"
import { fileURLToPath } from "url"
import path from "path"
import {
  UA,
  extOf,
  hasExcludedKeyword,
  extractMetaImage,
  extractImgCandidates,
  pickFallback,
  guessExt,
  fetchWithRetry,
  curlText,
  curlBinary,
} from "./lib/images.mjs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, "..")
const outDir = path.join(root, "public/images/sources")
mkdirSync(outDir, { recursive: true })

const sources = JSON.parse(
  (await import("fs")).readFileSync(path.join(root, "data/sources.json"), "utf-8"),
)

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
