import { closeSync, openSync, readSync } from "fs"
import { join } from "path"

// 先頭バイトから画像の横幅を読む(PNG/GIF/WebP/JPEG)。読めなければ0
export const widthFromHeader = (b: Buffer): number => {
  if (b.toString("ascii", 1, 4) === "PNG") return b.readUInt32BE(16)
  if (b.toString("ascii", 0, 3) === "GIF") return b.readUInt16LE(6)
  if (b.toString("ascii", 8, 12) === "WEBP") {
    const chunk = b.toString("ascii", 12, 16)
    if (chunk === "VP8 ") return b.readUInt16LE(26) & 0x3fff
    if (chunk === "VP8L") return (b.readUInt16LE(21) & 0x3fff) + 1
    if (chunk === "VP8X") return b.readUIntLE(24, 3) + 1
    return 0
  }
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) return 0
      const marker = b[i + 1]
      // SOF0〜SOF15(DHT/JPG/DACを除く)に寸法が入る
      if (
        marker >= 0xc0 &&
        marker <= 0xcf &&
        ![0xc4, 0xc8, 0xcc].includes(marker)
      )
        return b.readUInt16BE(i + 7)
      i += 2 + b.readUInt16BE(i + 2)
    }
  }
  return 0
}

const cache = new Map<string, number>()

// public/配下の画像の横幅(ビルド時に評価)
export const imageWidth = (src: string): number => {
  if (!src.startsWith("/")) return 0
  if (!cache.has(src)) {
    let width = 0
    try {
      // ponytail: JPEGのSOFが先頭64KB以降にある場合は0扱い(大判表示しないだけ)
      const buffer = Buffer.alloc(65536)
      const fd = openSync(join(process.cwd(), "public", src), "r")
      const read = readSync(fd, buffer, 0, buffer.length, 0)
      closeSync(fd)
      width = widthFromHeader(buffer.subarray(0, read))
    } catch {
      // 読めない画像は大判にしない
    }
    cache.set(src, width)
  }
  return cache.get(src)!
}

// 大きく表示しても荒れない画像か
export const isLargeImage = (src: string | null): src is string =>
  !!src && imageWidth(src) >= 640
