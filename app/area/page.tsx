import Link from "next/link"
import { FC } from "react"
import { Section } from "@/components/elements/content"
import { AREAS } from "@/lib/types"

const Page: FC = () => (
  <Section title="エリア">
    <ul style={{ display: "grid", gap: ".5rem", listStyle: "none", padding: 0 }}>
      {AREAS.map((area) => (
        <li key={area.slug}>
          <Link
            href={`/area/${area.slug}/`}
            style={{ color: "#1a1a1a", fontSize: ".9rem" }}
          >
            {area.name}
          </Link>
        </li>
      ))}
    </ul>
  </Section>
)

export default Page
