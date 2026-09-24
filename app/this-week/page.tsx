import { FC } from "react"
import {
  PeriodPage,
  PeriodPageConfig,
  periodMetadata,
} from "@/components/elements/event-hub"
import { thisWeekPeriod } from "@/lib/date"

const config: PeriodPageConfig = {
  path: "/this-week/",
  label: "今週",
  getPeriod: thisWeekPeriod,
}

export const metadata = periodMetadata(config)

const Page: FC = () => <PeriodPage config={config} />

export default Page
