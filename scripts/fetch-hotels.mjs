// 楽天トラベル施設検索APIで雷門周辺のホテルを取得し data/hotels.json に保存する
// 使い方: RAKUTEN_APPLICATION_ID=... RAKUTEN_ACCESS_KEY=... node scripts/fetch-hotels.mjs
import { writeFile } from "node:fs/promises"

const FILE = new URL("../data/hotels.json", import.meta.url)
const API =
  "https://openapi.rakuten.co.jp/engine/api/Travel/SimpleHotelSearch/20260731"
const AFFILIATE_ID = "589a7e53.27e6c7b2.589a7e54.37a5adb6"
// 雷門
const CENTER = { latitude: 35.7111, longitude: 139.7963 }

const { RAKUTEN_APPLICATION_ID, RAKUTEN_ACCESS_KEY } = process.env
if (!RAKUTEN_APPLICATION_ID || !RAKUTEN_ACCESS_KEY) {
  throw new Error("RAKUTEN_APPLICATION_ID と RAKUTEN_ACCESS_KEY が必要")
}

const hotels = []
for (let page = 1; page <= 3; page++) {
  const params = new URLSearchParams({
    applicationId: RAKUTEN_APPLICATION_ID,
    accessKey: RAKUTEN_ACCESS_KEY,
    affiliateId: AFFILIATE_ID,
    format: "json",
    datumType: "1",
    latitude: String(CENTER.latitude),
    longitude: String(CENTER.longitude),
    searchRadius: "1.5",
    hits: "30",
    page: String(page),
  })
  // 新APIはOriginで送信元を判定する(アプリ設定の許可サイトと完全一致が必要。サブドメイン不可)。
  // サーバーからはブラウザのように自動で付かないので明示する
  const res = await fetch(`${API}?${params}`, {
    headers: {
      Origin: "https://reload.co.jp",
      Referer: "https://reload.co.jp/",
    },
  })
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
  const data = await res.json()
  for (const { hotel } of data.hotels) {
    const info = hotel[0].hotelBasicInfo
    // 観光サイトに載せない成人向け施設を除く
    if (/大人専用|18禁|１８禁/.test(info.hotelName)) continue
    hotels.push({
      id: info.hotelNo,
      name: info.hotelName,
      url: info.hotelInformationUrl,
      image_url: info.hotelThumbnailUrl,
      min_charge: info.hotelMinCharge,
      review_average: info.reviewAverage,
      nearest_station: info.nearestStation,
      latitude: info.latitude,
      longitude: info.longitude,
    })
  }
  console.log(`page ${page}: ${data.hotels.length}`)
  if (page >= data.pagingInfo.pageCount) break
  await new Promise((resolve) => setTimeout(resolve, 1000))
}

await writeFile(FILE, JSON.stringify(hotels, null, 2) + "\n")
console.log(`saved ${hotels.length} hotels`)
