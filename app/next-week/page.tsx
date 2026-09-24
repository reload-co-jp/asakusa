import { FC } from "react"
import {
  PeriodPage,
  PeriodPageConfig,
  periodMetadata,
} from "@/components/elements/event-hub"
import { nextWeekPeriod } from "@/lib/date"

const config: PeriodPageConfig = {
  path: "/next-week/",
  label: "来週",
  getPeriod: nextWeekPeriod,
}

export const metadata = periodMetadata(config)

const Page: FC = () => <PeriodPage config={config} />

export default Page
