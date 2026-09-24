import { FC } from "react"
import {
  PeriodPage,
  PeriodPageConfig,
  periodMetadata,
} from "@/components/elements/event-hub"
import { weekendPeriod } from "@/lib/date"

const config: PeriodPageConfig = {
  path: "/weekend/",
  label: "今週末",
  getPeriod: weekendPeriod,
}

export const metadata = periodMetadata(config)

const Page: FC = () => <PeriodPage config={config} />

export default Page
