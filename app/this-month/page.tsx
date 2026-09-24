import { FC } from "react"
import {
  PeriodPage,
  PeriodPageConfig,
  periodMetadata,
} from "@/components/elements/event-hub"
import { thisMonthPeriod } from "@/lib/date"

const config: PeriodPageConfig = {
  path: "/this-month/",
  label: "今月",
  getPeriod: thisMonthPeriod,
  title: ({ from }) => {
    const [year, month] = from.split("-")
    return `${year}年${Number(month)}月の浅草イベント・祭り・公演`
  },
}

export const metadata = periodMetadata(config)

const Page: FC = () => <PeriodPage config={config} />

export default Page
