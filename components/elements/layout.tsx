import { ComponentProps, FC, ReactNode } from "react"

export const Title: FC<ComponentProps<"h1">> = ({
  style,
  children,
  ...props
}) => (
  <h1
    style={{
      color: "var(--ink)",
      fontFamily: "var(--font-serif)",
      fontSize: "clamp(1.9rem, 4.5vw, 2.6rem)",
      letterSpacing: ".12em",
      lineHeight: 1,
      margin: 0,
      fontWeight: 500,
      padding: 0,
      ...style,
    }}
    {...props}
  >
    {children}
  </h1>
)

export const Nav: FC<{
  links: { href: string; label: string }[]
}> = ({ links }) => (
  <nav>
    <ul
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: ".4rem 1.4rem",
        listStyle: "none",
        margin: ".9rem 0 0",
        padding: 0,
      }}
    >
      {links.map((link) => (
        <li key={link.href}>
          <a
            href={link.href}
            style={{
              color: "var(--ink-soft)",
              fontSize: ".78rem",
              letterSpacing: ".08em",
              textDecoration: "none",
              transition: "color .2s ease",
            }}
          >
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  </nav>
)

export const Header: FC<{ children: ReactNode }> = ({ children }) => (
  <header
    style={{
      background: "#fff",
      borderBottom: "1px solid var(--border)",
      padding: "1.4rem 1.5rem",
      position: "relative",
    }}
  >
    <div style={{ maxWidth: "60rem", margin: "auto" }}>{children}</div>
  </header>
)

export const Main: FC<{ children: ReactNode }> = ({ children }) => (
  <main
    style={{
      background: "var(--paper)",
      color: "var(--ink-soft)",
      minHeight: "calc(100dvh - 7rem)",
    }}
  >
    <div style={{ margin: "0 auto", maxWidth: "60rem", padding: "3rem 1.5rem" }}>
      {children}
    </div>
  </main>
)

export const Footer: FC<{ children: ReactNode }> = ({ children }) => (
  <footer
    style={{
      background: "#fff",
      borderTop: "1px solid var(--border)",
      padding: "2.5rem 1.5rem 1.75rem",
      textAlign: "center",
    }}
  >
    <p
      style={{
        color: "var(--ink)",
        fontFamily: "var(--font-serif)",
        fontSize: "1.1rem",
        letterSpacing: ".16em",
        margin: "0 0 .75rem",
      }}
    >
      浅草ライブ
    </p>
    <div
      style={{
        color: "var(--faint)",
        fontSize: ".72rem",
        letterSpacing: ".04em",
      }}
    >
      {children}
    </div>
  </footer>
)
