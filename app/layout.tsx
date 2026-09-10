import Script from "next/script"
import { Footer, Header, Main, Nav, Title } from "@/components/elements/layout"
import { SITE_URL } from "@/lib/json-ld"
import "./reset.css"

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: "浅草ライブ",
  description:
    "浅草エリアのイベント・新店舗・閉店・セール・POP UP・公演・祭り・地域ニュースを届ける浅草地域メディア",
}

const NAV_LINKS = [
  { href: "/", label: "最新情報" },
  { href: "/today/", label: "今日の公演・祭" },
  { href: "/this-week/", label: "今週の公演・祭" },
  { href: "/category/event/", label: "イベント" },
  { href: "/category/festival/", label: "祭り・季節行事" },
  { href: "/category/performance/", label: "公演・演芸" },
  { href: "/category/new_opening/", label: "新店舗" },
  { href: "/category/closing/", label: "閉店" },
  { href: "/category/sale/", label: "セール" },
  { href: "/category/popup/", label: "POP UP" },
  { href: "/category/exhibition/", label: "展示・アート" },
]

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="ja">
      <head />
      <body>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-YER1QP2CXX"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-YER1QP2CXX');
          `}
        </Script>
        <Script
          async
          crossOrigin="anonymous"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6542845006087970"
          strategy="afterInteractive"
        />
        <Header>
          <Title>
            <a href="/" style={{ color: "var(--ink)", textDecoration: "none" }}>
              浅草ライブ
            </a>
          </Title>
          <Nav links={NAV_LINKS} />
        </Header>
        <Main>{children}</Main>
        <Footer>
          <p>&copy; Asakusa Live</p>
        </Footer>
      </body>
    </html>
  )
}
export default RootLayout
