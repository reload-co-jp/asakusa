import Link from "next/link"
import { FC, Fragment } from "react"
import { getDictionary, localePath } from "@/lib/i18n"
import { jsonLdToHtml, SITE_URL } from "@/lib/json-ld"

export type Crumb = { name: string; href: string }

export const JsonLd: FC<{ data: unknown }> = ({ data }) => (
  <script
    dangerouslySetInnerHTML={{ __html: jsonLdToHtml(data) }}
    type="application/ld+json"
  />
)

// 先頭のサイト名は自動で付与。最後の要素は現在ページとしてリンクにしない。
// hrefは言語プレフィックス無しで渡す
export const Breadcrumbs: FC<{ items: Crumb[] }> = async ({ items }) => {
  const { locale, t } = await getDictionary()
  const crumbs = [{ name: t.siteName, href: "/" }, ...items].map((crumb) => ({
    ...crumb,
    href: localePath(locale, crumb.href),
  }))
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
    <nav aria-label={t.breadcrumbLabel} style={{ margin: "0 0 2rem" }}>
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

// SEOハブ間の内部リンク。hrefは言語プレフィックス無しで渡す
export const LinkList: FC<{ links: Crumb[] }> = async ({ links }) => {
  const { locale } = await getDictionary()
  return (
    <ul className="pills">
      {links.map((link) => (
        <li key={link.href}>
          <Link className="pill" href={localePath(locale, link.href)}>
            {link.name}
          </Link>
        </li>
      ))}
    </ul>
  )
}
