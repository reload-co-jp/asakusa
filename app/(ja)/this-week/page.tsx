import { FC } from "react"
import {
  PeriodPage,
  PeriodPageConfig,
  periodMetadata,
} from "@/components/elements/event-hub"
import { thisWeekPeriod } from "@/lib/date"

const config: PeriodPageConfig = {
  path: "/this-week/",
  label: "thisWeek",
  getPeriod: thisWeekPeriod,
}

export const generateMetadata = periodMetadata(config)

const Page: FC = () => <PeriodPage config={config} />

export default Page
