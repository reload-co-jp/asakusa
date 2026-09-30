import { PREFIXED_LOCALES } from "@/lib/i18n"

export { default, generateMetadata } from "@/app/(ja)/layout"

export const generateStaticParams = () =>
  PREFIXED_LOCALES.map((locale) => ({ locale }))

export const dynamicParams = false
