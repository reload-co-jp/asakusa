export const SITE_URL = "https://asakusa.reload.co.jp"

// JSON-LDを<script>タグに埋め込む際、データ内の"</script"等でタグが
// 閉じられるのを防ぐためエスケープする
export const jsonLdToHtml = (data: unknown): string =>
  JSON.stringify(data).replace(/</g, "\\u003c")
