export const SITE_URL = "https://asakusa.reload.co.jp"

// JSON-LDを<script>タグに埋め込む際、データ内の"</script"等でタグが
// 閉じられるのを防ぐためエスケープする
export const jsonLdToHtml = (data: unknown): string =>
  JSON.stringify(data).replace(/</g, "\\u003c")

// 日本語住所（例: 東京都渋谷区渋谷2-21-1）を schema.org の PostalAddress に分解する。
// Google のイベントリッチリザルトは location.address を PostalAddress で求めるため。
export const postalAddress = (address: string) => {
  const match = address.match(/^(東京都)(.+?[区市町村])(.*)$/)
  return {
    "@type": "PostalAddress",
    addressCountry: "JP",
    addressRegion: match ? match[1] : "東京都",
    ...(match && { addressLocality: match[2] }),
    streetAddress: match ? match[3] || address : address,
  }
}
