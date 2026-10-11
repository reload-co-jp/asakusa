import { Metadata } from "next"
import Script from "next/script"
import { LanguageSwitcher } from "@/components/elements/language-switcher"
import { Footer, Header, Main, Nav, Title } from "@/components/elements/layout"
import { Logo } from "@/components/elements/logo"
import { display, serif } from "@/lib/fonts"
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
  const mainLinks = [
    { href: "/today/", label: t.nav.today },
    { href: "/weekend/", label: t.nav.weekend },
    { href: "/events/", label: t.nav.events },
    { href: "/category/festival/", label: t.nav.festival },
    { href: "/category/performance/", label: t.nav.performance },
    { href: "/category/exhibition/", label: t.nav.exhibition },
    { href: "/category/popup/", label: t.nav.popup },
    { href: "/category/sale/", label: t.nav.sale },
    { href: "/category/new_opening/", label: t.nav.newOpening },
    { href: "/category/local_news/", label: t.nav.news },
    { href: "/place/", label: t.nav.spots },
  ].map((link) => ({ ...link, href: href(link.href) }))
  return (
    <html
      className={`${serif.variable} ${display.variable}`}
      lang={HTML_LANG[locale]}
    >
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
          <div className="masthead">
            <p aria-hidden="true" className="masthead__tagline">
              {t.home.hero}
            </p>
            <Title as="p" className="masthead__logo">
              <a className="site-logo" href={href("/")}>
                <Logo sub={t.siteName} />
              </a>
            </Title>
            <LanguageSwitcher label={t.languageLabel} locale={locale} />
          </div>
          <div className="masthead__bar">
            <Nav
              className="site-nav"
              label={t.home.byCategory}
              links={mainLinks}
            />
            <form
              action="https://www.google.com/search"
              className="search"
              method="get"
              role="search"
            >
              <input
                name="as_sitesearch"
                type="hidden"
                value={new URL(SITE_URL).host}
              />
              <input
                aria-label={t.search.label}
                className="search__input"
                name="q"
                placeholder={t.search.placeholder}
                type="search"
              />
              <button className="search__button" type="submit">
                {t.search.submit}
              </button>
            </form>
          </div>
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
        <Footer>
          <div className="site-footer__grid">
            <div>
              <a className="site-logo" href={href("/")}>
                <Logo sub={t.siteName} />
              </a>
              <p className="site-footer__tagline">{t.home.hero}</p>
            </div>
            <section>
              <h2 className="site-footer__heading">{t.footer.about}</h2>
              <p>{t.footer.aboutText}</p>
            </section>
            <section>
              <h2 className="site-footer__heading">{t.footer.operator}</h2>
              <p>
                <a href="https://reload.co.jp/">{t.footer.operatorName}</a>
              </p>
              <h2 className="site-footer__heading">{t.footer.contact}</h2>
              <p>
                <a href="https://reload.co.jp/">{t.footer.contactText}</a>
              </p>
            </section>
          </div>
          <Nav className="site-footer__nav" links={navLinks} />
          <p className="site-footer__copy">
            &copy; Asakusa Live — ASAKUSA JOURNAL
          </p>
        </Footer>
      </body>
    </html>
  )
}
export default RootLayout
