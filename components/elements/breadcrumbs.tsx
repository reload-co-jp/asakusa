import Link from "next/link"
import { FC, Fragment } from "react"
import { jsonLdToHtml, SITE_URL } from "@/lib/json-ld"

export type Crumb = { name: string; href: string }

export const JsonLd: FC<{ data: unknown }> = ({ data }) => (
  <script
    dangerouslySetInnerHTML={{ __html: jsonLdToHtml(data) }}
    type="application/ld+json"
  />
)

// 先頭の「浅草ライブ」は自動で付与。最後の要素は現在ページとしてリンクにしない
export const Breadcrumbs: FC<{ items: Crumb[] }> = ({ items }) => {
  const crumbs = [{ name: "浅草ライブ", href: "/" }, ...items]
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: `${SITE_URL}${crumb.href}`,
    })),
  }
  return (
    <nav aria-label="パンくずリスト" style={{ margin: "0 0 2rem" }}>
      <JsonLd data={jsonLd} />
      <ol
        style={{
          color: "var(--muted)",
          display: "flex",
          flexWrap: "wrap",
          fontSize: ".75rem",
          gap: ".4rem",
          listStyle: "none",
          margin: 0,
          padding: 0,
        }}
      >
        {crumbs.map((crumb, index) => (
          <Fragment key={crumb.href}>
            {index > 0 && <li aria-hidden="true">›</li>}
            <li>
              {index === crumbs.length - 1 ? (
                <span aria-current="page">{crumb.name}</span>
              ) : (
                <Link href={crumb.href} style={{ color: "var(--muted)" }}>
                  {crumb.name}
                </Link>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  )
}

// SEOハブ間の内部リンク
export const LinkList: FC<{ links: Crumb[] }> = ({ links }) => (
  <ul
    style={{
      display: "flex",
      flexWrap: "wrap",
      gap: ".5rem",
      listStyle: "none",
      margin: 0,
      padding: 0,
    }}
  >
    {links.map((link) => (
      <li key={link.href}>
        <Link
          href={link.href}
          style={{
            background: "#fff",
            border: "1px solid var(--border)",
            color: "var(--ink-soft)",
            display: "inline-block",
            fontSize: ".8rem",
            padding: ".4rem .8rem",
            textDecoration: "none",
          }}
        >
          {link.name}
        </Link>
      </li>
    ))}
  </ul>
)
