import { Footer, Header, Main, Nav, Title } from "@/components/elements/layout"
import "./reset.css"

export const metadata = {
  metadataBase: new URL("https://asakusa.reload.co.jp"),
  title: "浅草ライブ",
  description:
    "浅草エリアのイベント・新店舗・閉店・セール・POP UP・公演・祭り・地域ニュースを届ける浅草地域メディア",
}

const NAV_LINKS = [
  { href: "/", label: "最新情報" },
  { href: "/category/event/", label: "イベント" },
  { href: "/category/festival/", label: "祭り・季節行事" },
  { href: "/category/performance/", label: "公演・演芸" },
  { href: "/category/new_opening/", label: "新店舗" },
  { href: "/category/closing/", label: "閉店" },
  { href: "/category/sale/", label: "セール" },
  { href: "/category/popup/", label: "POP UP" },
  { href: "/category/exhibition/", label: "展示・アート" },
  { href: "/area/", label: "エリア" },
]

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="ja">
      <body>
        <Header>
          <Title>
            <a href="/" style={{ color: "#1a1a1a", textDecoration: "none" }}>
              浅草ライブ
            </a>
          </Title>
          <Nav links={NAV_LINKS} />
        </Header>
        <Main>{children}</Main>
        <Footer>
          <p>&copy; 浅草ライブ</p>
        </Footer>
      </body>
    </html>
  )
}
export default RootLayout
