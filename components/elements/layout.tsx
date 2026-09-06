import { ComponentProps, FC, ReactNode } from "react"

export const Title: FC<ComponentProps<"h1">> = ({
  style,
  children,
  ...props
}) => (
  <h1
    style={{
      color: "#1a1a1a",
      fontFamily: "'Yu Mincho', 'Hiragino Mincho ProN', serif",
      fontSize: "3rem",
      letterSpacing: ".05em",
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
        gap: ".3rem 1.1rem",
        listStyle: "none",
        margin: ".6rem 0 0",
        padding: 0,
      }}
    >
      {links.map((link) => (
        <li key={link.href}>
          <a
            href={link.href}
            style={{
              color: "#5c5c5c",
              fontSize: ".8rem",
              letterSpacing: ".02em",
              textDecoration: "none",
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
      borderBottom: "1px solid #e5e2dc",
      padding: ".9rem 1.25rem",
      position: "relative",
    }}
  >
    <div style={{ maxWidth: "56rem", margin: "auto" }}>{children}</div>
  </header>
)

export const Main: FC<{ children: ReactNode }> = ({ children }) => (
  <main
    style={{
      background: "#fff",
      color: "#333",
      margin: "0 auto",
      maxWidth: "56rem",
      minHeight: "calc(100dvh - 7rem)",
      padding: "2rem 1.25rem",
    }}
  >
    {children}
  </main>
)

export const Footer: FC<{ children: ReactNode }> = ({ children }) => (
  <footer
    style={{
      background: "#faf9f6",
      borderTop: "1px solid #e5e2dc",
      color: "#8a8a8a",
      fontSize: ".75rem",
      padding: "1.25rem",
      textAlign: "center",
    }}
  >
    {children}
  </footer>
)
