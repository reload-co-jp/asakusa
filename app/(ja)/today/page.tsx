import { FC } from "react"
import {
  PeriodPage,
  PeriodPageConfig,
  periodMetadata,
} from "@/components/elements/event-hub"
import { todayPeriod } from "@/lib/date"

const config: PeriodPageConfig = {
  path: "/today/",
  label: "today",
  getPeriod: todayPeriod,
}

export const generateMetadata = periodMetadata(config)

const Page: FC = () => <PeriodPage config={config} />

export default Page
