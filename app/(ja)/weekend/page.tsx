import { FC } from "react"
import {
  PeriodPage,
  PeriodPageConfig,
  periodMetadata,
} from "@/components/elements/event-hub"
import { weekendPeriod } from "@/lib/date"

const config: PeriodPageConfig = {
  path: "/weekend/",
  label: "weekend",
  getPeriod: weekendPeriod,
}

export const generateMetadata = periodMetadata(config)

const Page: FC = () => <PeriodPage config={config} />

export default Page
