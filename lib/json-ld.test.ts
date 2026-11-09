import { describe, expect, it } from "vitest"
import { postalAddress } from "./json-ld"

describe("postalAddress", () => {
  it("splits a Tokyo address into region, locality and street", () => {
    expect(postalAddress("東京都渋谷区渋谷2-21-1")).toEqual({
      "@type": "PostalAddress",
      addressCountry: "JP",
      addressRegion: "東京都",
      addressLocality: "渋谷区",
      streetAddress: "渋谷2-21-1",
    })
  })

  it("keeps an unparsable address as streetAddress", () => {
    expect(postalAddress("15-1 Udagawa-cho, Shibuya-ku, Tokyo")).toEqual({
      "@type": "PostalAddress",
      addressCountry: "JP",
      addressRegion: "東京都",
      streetAddress: "15-1 Udagawa-cho, Shibuya-ku, Tokyo",
    })
  })
})
