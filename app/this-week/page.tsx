import { Metadata } from "next"
import { FC } from "react"
import { ContentList, Section } from "@/components/elements/content"
import { getThisWeekSchedule } from "@/lib/data"

export const dynamic = "force-static"

const TITLE = "今週の公演・演劇・コンサート・演芸・祭 | 浅草ライブ"
const DESCRIPTION =
  "浅草エリアで今週開催される公演・演劇・コンサート・演芸・祭りの最新情報一覧"

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website" },
}

const Page: FC = () => (
  <Section title="今週の公演・演劇・コンサート・演芸・祭">
    <ContentList contents={getThisWeekSchedule()} />
  </Section>
)

export default Page
