import { describe, expect, it } from "vitest"
import { shouldShowInterstitial } from "./ad"

describe("shouldShowInterstitial", () => {
  it("外部からの着地は数えない", () => {
    expect(shouldShowInterstitial(0, false)).toEqual([false, 0])
  })
  it("内部遷移3回に1回表示", () => {
    expect(shouldShowInterstitial(0, true)).toEqual([false, 1])
    expect(shouldShowInterstitial(1, true)).toEqual([false, 2])
    expect(shouldShowInterstitial(2, true)).toEqual([true, 3])
    expect(shouldShowInterstitial(3, true)).toEqual([false, 4])
  })
})
