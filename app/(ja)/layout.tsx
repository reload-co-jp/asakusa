import { Metadata } from "next"
import Script from "next/script"
import { LanguageSwitcher } from "@/components/elements/language-switcher"
import { Footer, Header, Main, Nav, Title } from "@/components/elements/layout"
import { getDictionary, HTML_LANG, localePath } from "@/lib/i18n"
import { SITE_URL } from "@/lib/json-ld"
import "../reset.css"

// /en/ /zh/ の[locale]ルートレイアウトと共用
export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getDictionary()
  return {
    metadataBase: new URL(SITE_URL),
    title: t.siteName,
    description: t.siteDescription,
    // 動的セグメント[locale]下ではファイル規約のopengraph-imageが静的exportで正しく出力されないためpublic/に置く
    openGraph: { images: "/opengraph-image.png" },
  }
}

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  const { locale, t } = await getDictionary()
  const href = (path: string) => localePath(locale, path)
  const navLinks = [
    { href: "/", label: t.nav.latest },
    { href: "/events/", label: t.nav.events },
    { href: "/today/", label: t.nav.today },
    { href: "/this-week/", label: t.nav.thisWeek },
    { href: "/weekend/", label: t.nav.weekend },
    { href: "/this-month/", label: t.nav.thisMonth },
    { href: "/category/festival/", label: t.nav.festival },
    { href: "/category/performance/", label: t.nav.performance },
    { href: "/category/new_opening/", label: t.nav.newOpening },
    { href: "/category/closing/", label: t.nav.closing },
    { href: "/category/sale/", label: t.nav.sale },
    { href: "/category/popup/", label: t.nav.popup },
    { href: "/category/exhibition/", label: t.nav.exhibition },
    { href: "/place/", label: t.nav.places },
  ].map((link) => ({ ...link, href: href(link.href) }))
  return (
    <html lang={HTML_LANG[locale]}>
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
          <Title as="p">
            <a
              href={href("/")}
              style={{ color: "var(--ink)", textDecoration: "none" }}
            >
              {t.siteName}
            </a>
          </Title>
          <LanguageSwitcher label={t.languageLabel} locale={locale} />
          <Nav links={navLinks} />
        </Header>
        <Main>
          {children}
          <ins
            className="adsbygoogle"
            style={{ display: "block" }}
            data-ad-client="ca-pub-6542845006087970"
            data-ad-slot="4829146611"
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
          <Script id="adsbygoogle-push" strategy="afterInteractive">
            {`(adsbygoogle = window.adsbygoogle || []).push({});`}
          </Script>
        </Main>
        <Footer siteName={t.siteName}>
          <p>&copy; Asakusa Live</p>
        </Footer>
      </body>
    </html>
  )
}
export default RootLayout
