import { FC } from "react"
import {
  PeriodPage,
  PeriodPageConfig,
  periodMetadata,
} from "@/components/elements/event-hub"
import { formatMonth, thisMonthPeriod } from "@/lib/date"
import { DICTIONARIES } from "@/lib/i18n"

const config: PeriodPageConfig = {
  path: "/this-month/",
  label: "thisMonth",
  getPeriod: thisMonthPeriod,
  title: ({ from }, locale) => {
    const [year, month] = from.split("-")
    return DICTIONARIES[locale].hub.thisMonthTitle(
      formatMonth(year, month, locale)
    )
  },
}

export const generateMetadata = periodMetadata(config)

const Page: FC = () => <PeriodPage config={config} />

export default Page
