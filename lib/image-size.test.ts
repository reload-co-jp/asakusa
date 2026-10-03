import { execFileSync } from "child_process"
import { readdirSync } from "fs"
import { describe, expect, it } from "vitest"
import { imageWidth } from "./image-size"

// macOSのsipsと突き合わせる(他OSではスキップ)
describe.runIf(process.platform === "darwin")("imageWidth", () => {
  it("matches sips for every content image", () => {
    for (const file of readdirSync("public/images/contents")) {
      const out = execFileSync("sips", [
        "-g",
        "pixelWidth",
        `public/images/contents/${file}`,
      ]).toString()
      const expected = Number(out.match(/pixelWidth: (\d+)/)![1])
      expect(imageWidth(`/images/contents/${file}`), file).toBe(expected)
    }
  })
})
