"use client"

import { FC, useEffect } from "react"

declare global {
  interface Window {
    adsbygoogle?: unknown[]
  }
}

// クライアント遷移でも記事ごとに広告を読み込むため useEffect で push する
export const InArticleAd: FC = () => {
  useEffect(() => {
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {
      // 広告ブロッカー等で失敗しても本文表示に影響させない
    }
  }, [])
  return (
    <ins
      className="adsbygoogle"
      data-ad-client="ca-pub-6542845006087970"
      data-ad-format="fluid"
      data-ad-layout="in-article"
      data-ad-slot="4625326006"
      style={{ display: "block", margin: "2rem 0", textAlign: "center" }}
    />
  )
}
