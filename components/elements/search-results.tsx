"use client"

import { useSearchParams } from "next/navigation"
import { FC, ReactNode } from "react"

type Item = { key: number; text: string; node: ReactNode }

// 静的exportのため全記事を受け取り、?q=でクライアント側で絞る(空白区切りAND・大小無視)
export const SearchResults: FC<{
  items: Item[]
  count: string
  empty: string
}> = ({ items, count, empty }) => {
  const query = useSearchParams().get("q")?.trim() ?? ""
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  const hits = terms.length
    ? items.filter((item) => terms.every((term) => item.text.includes(term)))
    : []
  return (
    <>
      <p className="empty">
        {query && `「${query}」 `}
        {hits.length ? count.replace("{n}", String(hits.length)) : empty}
      </p>
      {hits.length > 0 && (
        <div className="card-grid">
          {hits.map((item) => (
            <div key={item.key}>{item.node}</div>
          ))}
        </div>
      )}
    </>
  )
}
