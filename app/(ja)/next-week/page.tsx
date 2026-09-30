import { FC } from "react"
import {
  PeriodPage,
  PeriodPageConfig,
  periodMetadata,
} from "@/components/elements/event-hub"
import { nextWeekPeriod } from "@/lib/date"

const config: PeriodPageConfig = {
  path: "/next-week/",
  label: "nextWeek",
  getPeriod: nextWeekPeriod,
}

export const generateMetadata = periodMetadata(config)

const Page: FC = () => <PeriodPage config={config} />

export default Page
