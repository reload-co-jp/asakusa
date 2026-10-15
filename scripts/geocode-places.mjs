// 緯度経度が未設定の場所を、住所から国土地理院の住所検索APIでジオコーディングする
// 使い方: node scripts/geocode-places.mjs
import { readFile, writeFile } from "node:fs/promises"

const FILE = new URL("../data/places.json", import.meta.url)
const API = "https://msearch.gsi.go.jp/address-search/AddressSearch?q="

const places = JSON.parse(await readFile(FILE, "utf8"))

for (const place of places) {
  if (place.latitude != null && place.longitude != null) continue
  // 「浅草1-1-12 浅草地下街」のような建物名は検索の妨げになるので落とす
  const query = place.address.split(/\s/)[0]
  const res = await fetch(API + encodeURIComponent(query))
  const [hit] = await res.json()
  // 号まで一致しない結果は位置がずれるため採用しない
  if (!hit || !hit.properties.title.endsWith("号")) {
    console.warn(`skip ${place.id}: ${query} -> ${hit?.properties.title}`)
    continue
  }
  const [longitude, latitude] = hit.geometry.coordinates
  place.latitude = latitude
  place.longitude = longitude
  console.log(`${place.id}: ${hit.properties.title} ${latitude},${longitude}`)
  await new Promise((resolve) => setTimeout(resolve, 300))
}

await writeFile(FILE, JSON.stringify(places, null, 2) + "\n")
