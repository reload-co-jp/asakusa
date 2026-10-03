"use client"

import { usePathname } from "next/navigation"
import { FC } from "react"
import { Locale, LOCALE_NAMES, LOCALES, localePath } from "@/lib/i18n-config"

// 現在ページの他言語版へリンク。ルートレイアウトが異なるため通常の<a>で遷移
export const LanguageSwitcher: FC<{ label: string; locale: Locale }> = ({
  label,
  locale,
}) => {
  const pathname = usePathname() ?? "/"
  const basePath =
    locale === "ja" ? pathname : pathname.replace(`/${locale}`, "") || "/"
  return (
    <nav aria-label={label} className="lang-switch">
      {LOCALES.map((l) => (
        <a
          aria-current={l === locale ? "true" : undefined}
          href={localePath(l, basePath)}
          hrefLang={l}
          key={l}
          style={{
            color: l === locale ? "var(--ink)" : "var(--muted)",
            textDecoration: "none",
          }}
        >
          {LOCALE_NAMES[l]}
        </a>
      ))}
    </nav>
  )
}
