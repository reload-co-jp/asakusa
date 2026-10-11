import { ComponentProps, FC, ReactNode } from "react"

// ページ毎のH1と重複させないため、共通ヘッダーのサイト名は as="p" で使う
export const Title: FC<ComponentProps<"h1"> & { as?: "h1" | "p" }> = ({
  as: Tag = "h1",
  children,
  ...props
}) => <Tag {...props}>{children}</Tag>

export const Nav: FC<{
  links: { href: string; label: string }[]
  className?: string
  label?: string
}> = ({ links, className, label }) => (
  <nav aria-label={label} className={className}>
    <ul>
      {links.map((link) => (
        <li key={link.href}>
          <a href={link.href}>{link.label}</a>
        </li>
      ))}
    </ul>
  </nav>
)

// 新聞の題字風マストヘッド
export const Header: FC<{ children: ReactNode }> = ({ children }) => (
  <header className="site-header">
    <div className="container site-header__inner">{children}</div>
  </header>
)

export const Main: FC<{ children: ReactNode }> = ({ children }) => (
  <main style={{ color: "var(--ink-soft)", overflowX: "clip" }}>
    <div
      className="container"
      style={{ minHeight: "60vh", paddingBlock: "2rem 4rem" }}
    >
      {children}
    </div>
  </main>
)

export const Footer: FC<{ children: ReactNode }> = ({ children }) => (
  <footer className="site-footer">
    <div className="container">{children}</div>
  </footer>
)
