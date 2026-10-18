"use client"

import { usePathname } from "next/navigation"
import { FC, useEffect, useRef, useState } from "react"

declare global {
  interface Window {
    adsbygoogle?: unknown[]
  }
}

// クライアント遷移でも記事ごとに広告を読み込むため useEffect で push する
export const InArticleAd: FC = () => {
  const pushed = useRef(false)
  useEffect(() => {
    // StrictMode の effect 二重実行で空き ins 無しの push が走るのを防ぐ
    if (pushed.current) return
    pushed.current = true
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

const DisplayAd: FC = () => {
  const pushed = useRef(false)
  useEffect(() => {
    if (pushed.current) return
    pushed.current = true
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {
      // 広告ブロッカー等で失敗しても表示に影響させない
    }
  }, [])
  return (
    <ins
      className="adsbygoogle"
      data-ad-client="ca-pub-6542845006087970"
      data-ad-format="auto"
      data-ad-slot="4829146611"
      data-full-width-responsive="true"
      style={{ display: "block" }}
    />
  )
}

const COUNT_KEY = "transition-count"

// 2回目以降の遷移で偶数回目にだけ表示する。検索等からの着地(外部リファラ)は数えない
export const shouldShowInterstitial = (
  count: number,
  isInternal: boolean
): [show: boolean, next: number] =>
  isInternal ? [(count + 1) % 2 === 0, count + 1] : [false, count]

export const TransitionOverlay: FC<{
  links: { href: string; label: string }[]
  labels: { label: string; close: string; top: string }
  topHref: string
}> = ({ links, labels, topHref }) => {
  const pathname = usePathname()
  const dialog = useRef<HTMLDialogElement>(null)
  const first = useRef(true)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // 初回マウントはフルロード。<a>による内部遷移かはリファラで判定
    const isInternal = first.current
      ? document.referrer.startsWith(location.origin)
      : true
    first.current = false
    try {
      const [show, next] = shouldShowInterstitial(
        Number(sessionStorage.getItem(COUNT_KEY)) || 0,
        isInternal
      )
      sessionStorage.setItem(COUNT_KEY, String(next))
      if (show) {
        // sessionStorage はマウント後にしか読めないため effect 内で開く
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setOpen(true)
        dialog.current?.showModal()
      }
    } catch {
      // ストレージ不可の環境では表示しない
    }
  }, [pathname])

  return (
    <dialog
      aria-label={labels.label}
      className="interstitial"
      onClose={() => setOpen(false)}
      ref={dialog}
    >
      <form className="interstitial__head" method="dialog">
        <span className="interstitial__label">{labels.label}</span>
        <button className="interstitial__close" type="submit">
          {labels.close} ✕
        </button>
      </form>
      {/* 開いている間だけ ins を置き、表示毎に広告をリクエストする */}
      {open && (
        <>
          <DisplayAd />
          <InArticleAd />
        </>
      )}
      <nav className="interstitial__nav">
        <a className="interstitial__top" href={topHref}>
          {labels.top}
        </a>
        <ul>
          {links.map((link) => (
            <li key={link.href}>
              <a href={link.href}>{link.label}</a>
            </li>
          ))}
        </ul>
      </nav>
    </dialog>
  )
}
