// 画像未設定の場所について、公式サイトのog:image等を取得しローカル保存する
// 使い方: node scripts/fetch-place-images.mjs
import { mkdirSync, readFileSync, writeFileSync } from "fs"
import path from "path"
import { fileURLToPath } from "url"
import {
  UA,
  curlText,
  downloadImage,
  extOf,
  extractImgCandidates,
  extractMetaImage,
  fetchWithRetry,
  guessExt,
  hasExcludedKeyword,
  pickFallback,
} from "./lib/images.mjs"

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..")
const file = path.join(root, "data/places.json")
const outDir = path.join(root, "public/images/spots")
mkdirSync(outDir, { recursive: true })

const places = JSON.parse(readFileSync(file, "utf-8"))

for (const place of places) {
  if (place.image_url || !place.url) continue
  let html, finalUrl
  try {
    const res = await fetchWithRetry(place.url, {
      headers: { "User-Agent": UA, "Accept-Language": "ja,en;q=0.8" },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    })
    html = await res.text()
    finalUrl = res.url
  } catch {
    html = await curlText(place.url, UA).catch(() => "")
    finalUrl = place.url
  }

  let imageUrl = extractMetaImage(html, finalUrl)
  if (imageUrl && (extOf(imageUrl) === "svg" || hasExcludedKeyword(imageUrl))) {
    imageUrl = null
  }
  // ロゴ等(excluded)しか見つからない場合は採用しない
  const picked = imageUrl
    ? null
    : pickFallback(extractImgCandidates(html, finalUrl))
  if (!imageUrl && picked && !picked.excluded) imageUrl = picked.url
  if (!imageUrl) {
    console.warn(`skip ${place.id}: no image`)
    continue
  }

  const buf = await downloadImage(imageUrl, place.url)
  // 小さすぎる画像はアイコン類のため採用しない
  if (!buf || buf.length < 10000) {
    console.warn(`skip ${place.id}: too small ${imageUrl}`)
    continue
  }
  const name = `${place.id}.${guessExt(imageUrl, null)}`
  writeFileSync(path.join(outDir, name), buf)
  place.image_url = `/images/spots/${name}`
  console.log(`${place.id}: ${imageUrl} (${buf.length})`)
}

writeFileSync(file, JSON.stringify(places, null, 2) + "\n")
