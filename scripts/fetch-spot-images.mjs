// 写真未設定のスポットについて、公式サイトや食べログから画像を探し、
// public/images/spots/ に保存して data/places.json の image_url を更新する
// 使い方: node scripts/fetch-spot-images.mjs [--ids=a,b] [--area=浅草] [--all] [--prefer=tabelog] [--dry-run]
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import path from "path"
import { fileURLToPath } from "url"
import {
  UA,
  downloadImage,
  extOf,
  extractImgCandidates,
  extractMetaImage,
  guessExt,
  hasExcludedKeyword,
  imageWidth,
  pickFallback,
} from "./lib/images.mjs"
import {
  AREA_PATHS,
  fetchShop,
  imageCandidates,
  keywordCandidates,
  nameScore,
  searchShops,
} from "./lib/tabelog.mjs"

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..")
const file = path.join(root, "data/places.json")
const outDir = path.join(root, "public/images/spots")
mkdirSync(outDir, { recursive: true })

const args = process.argv.slice(2)
const dryRun = args.includes("--dry-run")
const idsArg = args.find((a) => a.startsWith("--ids="))
const onlyIds = idsArg
  ? new Set(idsArg.slice("--ids=".length).split(","))
  : null
const areaArg = args.find((a) => a.startsWith("--area="))
const onlyArea = areaArg ? areaArg.slice("--area=".length) : null
const preferArg = args.find((a) => a.startsWith("--prefer="))
// 取得先の優先(既定は公式サイト優先。tabelog を指定すると食べログのみを使う)
const prefer = preferArg ? preferArg.slice("--prefer=".length) : "official"
const force = args.includes("--all")
const debug = args.includes("--debug")

// 採用する画像の最小横幅(px)。これ未満はロゴ・アイコン等として採用しない
const MIN_WIDTH = 400
// これ以下しか無い場合は下限を緩くして採用する
const FALLBACK_WIDTH = 320
// 取得画像の最小サイズ(バイト)
const MIN_SIZE = 8000
// 検索する店舗ページ数の上限
const MAX_SHOP_PAGES = 5
// 縦横比がこの範囲を超える画像はバナー等とみなして採用しない
const MAX_ASPECT = 2.5

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// 2点間の距離(メートル)
const distance = (lat1, lon1, lat2, lon2) => {
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * 6371000 * Math.asin(Math.sqrt(a))
}

// 住所の番地(浅草2-5-14)を取り出す
const addressKey = (address) => {
  const m = address?.match(/(\d+)-\d+(?:-\d+)?/)
  return m ? m[0] : null
}

// 食べログのエリアパスを決める(該当があれば優先)
const areaPathsFor = (place) => {
  const matched = AREA_PATHS.filter((area) =>
    area.areas.some((name) => place.area?.includes(name))
  )
  return [...matched, ...AREA_PATHS.filter((a) => !matched.includes(a))]
}

// 公式サイトから画像候補を1つ取得
const fromOfficialSite = async (place) => {
  if (!place.url) return null
  let html
  try {
    const res = await fetch(place.url, {
      headers: { "User-Agent": UA, "Accept-Language": "ja,en;q=0.8" },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    })
    html = await res.text()
  } catch {
    return null
  }
  const meta = extractMetaImage(html, place.url)
  if (meta && extOf(meta) !== "svg" && !hasExcludedKeyword(meta)) {
    return { url: meta, source: place.url }
  }
  const picked = pickFallback(extractImgCandidates(html, place.url))
  if (picked && !picked.excluded) {
    return { url: picked.url, source: place.url }
  }
  return null
}

// 食べログで同じ店舗を探して画像候補を返す
const fromTabelog = async (place) => {
  let best = null
  for (const area of areaPathsFor(place)) {
    for (const keyword of keywordCandidates(place.name)) {
      const shops = await searchShops(keyword, area.path)
      if (debug) {
        console.log(
          `  [debug] search "${keyword}" in ${area.path} -> ${shops.length}`
        )
      }
      if (shops.length === 0) continue
      for (const candidate of shops.slice(0, MAX_SHOP_PAGES)) {
        const shop = await fetchShop(candidate.url)
        if (!shop) continue
        const score = nameScore(place.name, shop.name)
        const dist =
          place.latitude != null &&
          place.longitude != null &&
          shop.latitude != null &&
          shop.longitude != null
            ? distance(
                place.latitude,
                place.longitude,
                shop.latitude,
                shop.longitude
              )
            : null
        const sameAddress =
          addressKey(place.address) && addressKey(shop.address)
            ? addressKey(place.address) === addressKey(shop.address)
            : false
        // 名前が合い、近くに同じ住所の店舗があるものを採用する
        const nearEnough = dist != null && dist <= 120
        const matched =
          (score >= 0.5 && nearEnough) ||
          (score >= 0.5 && sameAddress) ||
          (score >= 0.85 && dist != null && dist <= 300) ||
          (score >= 0.9 && dist == null)
        if (!matched) {
          if (debug) {
            console.log(
              `  [debug] ${place.id} / ${shop.name} score=${score.toFixed(2)} dist=${dist == null ? "-" : Math.round(dist)}`
            )
          }
          continue
        }
        if (debug) {
          console.log(
            `  [debug] ${place.id} matched ${shop.name} score=${score.toFixed(2)} dist=${dist == null ? "-" : Math.round(dist)}`
          )
        }
        // 同じ住所 > 名前の一致度 > 距離 の順に優先する
        const rank = [sameAddress ? 1 : 0, score, dist == null ? 0 : -dist]
        if (
          !best ||
          rank[0] > best.rank[0] ||
          (rank[0] === best.rank[0] && rank[1] > best.rank[1]) ||
          (rank[0] === best.rank[0] &&
            rank[1] === best.rank[1] &&
            rank[2] > best.rank[2])
        ) {
          best = {
            source: shop.url,
            score,
            dist,
            rank,
            candidates: imageCandidates(shop),
          }
        }
      }
      // 同じ住所の店舗が見つかればそこで打ち切る
      if (best && best.rank[0] === 1) break
    }
    if (best && best.rank[0] === 1) break
  }
  return best
}

// 画像の高さ(px)。読めなければ0
const heightOf = (buf) => {
  if (buf.toString("ascii", 1, 4) === "PNG") return buf.readUInt32BE(20)
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) return 0
      const marker = buf[i + 1]
      if (
        marker >= 0xc0 &&
        marker <= 0xcf &&
        ![0xc4, 0xc8, 0xcc].includes(marker)
      )
        return buf.readUInt16BE(i + 5)
      i += 2 + buf.readUInt16BE(i + 2)
    }
  }
  return 0
}

// 候補URLから画像を取得し、保存する
const saveImage = async (place, candidate) => {
  let fallback = null
  for (const url of candidate.candidates) {
    const buf = await downloadImage(url, candidate.source)
    if (debug) {
      console.log(
        `  [debug] try ${url} -> ${buf ? `${buf.length}bytes ${imageWidth(buf)}px` : "null"}`
      )
    }
    if (!buf || buf.length < MIN_SIZE) continue
    const width = imageWidth(buf)
    if (width < FALLBACK_WIDTH) continue
    const height = heightOf(buf)
    // 極端に横長(バナー等)の画像は使わず、次の候補に回す
    if (height > 0 && width / height > MAX_ASPECT) continue
    const ext = guessExt(url, null)
    const name = `${place.id}.${ext}`
    const result = { name, width, bytes: buf.length, url, buf }
    if (width >= MIN_WIDTH) {
      if (!dryRun) {
        writeFileSync(path.join(outDir, name), buf)
        place.image_url = `/images/spots/${name}`
        // 出典URL(情報源)は残す
        if (!place.source_url) place.source_url = candidate.source
      }
      return result
    }
    // 小さめの画像しか無ければ、それを採用する
    fallback ??= result
  }
  if (fallback) {
    if (!dryRun) {
      writeFileSync(path.join(outDir, fallback.name), fallback.buf)
      place.image_url = `/images/spots/${fallback.name}`
      if (!place.source_url) place.source_url = candidate.source
    }
    return fallback
  }
  return null
}

const main = async () => {
  const places = JSON.parse(readFileSync(file, "utf-8"))
  const targets = places.filter((place) => {
    if (onlyIds) return onlyIds.has(place.id)
    if (onlyArea) return place.area?.includes(onlyArea)
    return true
  })

  let saved = 0
  let skipped = 0
  for (const place of targets) {
    // 既存の画像(ファイルが実在し十分な大きさ)があればスキップ
    if (!force && place.image_url) {
      const local = path.join(root, "public", place.image_url)
      if (existsSync(local)) {
        const buf = readFileSync(local)
        if (imageWidth(buf) >= MIN_WIDTH) {
          skipped++
          continue
        }
      }
    }

    const candidates = []
    // 公式サイトを先に探し、なければ食べログにフォールバックする
    if (prefer !== "tabelog") {
      const official = await fromOfficialSite(place)
      if (official) candidates.push({ ...official, candidates: [official.url] })
    }
    {
      const tabelog = await fromTabelog(place)
      if (tabelog) candidates.push(tabelog)
    }

    let result = null
    let matchedCandidate = null
    for (const candidate of candidates) {
      result = await saveImage(place, candidate)
      if (result) {
        matchedCandidate = candidate
        break
      }
    }

    if (result) {
      saved++
      console.log(
        `${place.id}: ${result.url} (${result.width}px, ${result.bytes}bytes)${
          matchedCandidate?.score != null
            ? ` [${place.name} ~ ${matchedCandidate.score.toFixed(2)}${
                matchedCandidate.dist != null
                  ? `, ${Math.round(matchedCandidate.dist)}m`
                  : ""
              }]`
            : ""
        }`
      )
    } else {
      skipped++
      console.warn(`skip ${place.id}: no image (${place.name})`)
    }
    await sleep(500)
  }

  console.log(`\n保存: ${saved} / 見送り: ${skipped}`)
  if (dryRun) {
    console.log("[dry-run] ファイルは更新していない")
    return
  }
  writeFileSync(file, JSON.stringify(places, null, 2) + "\n")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
