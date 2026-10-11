import { Cormorant_Garamond, Noto_Serif_JP } from "next/font/google"

// 見出し(明朝)。和文は分割配信されるためpreloadしない
export const serif = Noto_Serif_JP({
  weight: ["500", "700"],
  subsets: ["latin"],
  preload: false,
  display: "swap",
  variable: "--font-serif",
})

// ロゴ・欧文見出し用のディスプレイセリフ
export const display = Cormorant_Garamond({
  weight: ["600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
})
