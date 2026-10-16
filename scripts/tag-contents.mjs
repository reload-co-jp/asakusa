// data/contents.json のイベント記事のうち tags 未設定のものにテーマタグを付ける(--force で全件やり直し)。
// 新規記事は fetch-contents.mjs が抽出時に付けるため、既存記事のバックフィル・判定基準変更時に使う
import { readFileSync, writeFileSync } from "fs"
import { fileURLToPath } from "url"
import { execFile } from "child_process"
import path from "path"
import { parseTags, THEME_RULE } from "./lib/themes.mjs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const contentsPath = path.join(__dirname, "../data/contents.json")

const CLAUDE_TIMEOUT_MS = 180000
const MODEL = process.env.ANTHROPIC_MODEL || "sonnet"
const CONCURRENCY = Number(process.env.CONCURRENCY || 4)
const BATCH_SIZE = 10
const MAX_BODY_LENGTH = 1500

const force = process.argv.includes("--force")

const SYSTEM_PROMPT = `あなたは浅草の地域メディア「浅草ライブ」の編集者。
入力はイベント記事のJSON配列({id, title, summary, body})。各記事にテーマタグを付ける。
${THEME_RULE}
- 本文に書かれていないことは推測しない
- 出力は {"<id>": ["free", ...], ...} のJSONのみ。全idを含める。前置き・コードフェンス禁止`

const runClaude = (userPrompt) =>
  new Promise((resolve, reject) => {
    const child = execFile(
      "claude",
      [
        "-p",
        userPrompt,
        "--output-format",
        "json",
        "--model",
        MODEL,
        "--effort",
        "low",
        "--system-prompt",
        SYSTEM_PROMPT,
        "--allowedTools",
        "",
        "--safe-mode",
      ],
      { timeout: CLAUDE_TIMEOUT_MS, maxBuffer: 20 * 1024 * 1024 },
      (err, stdout, stderr) => {
        if (err) {
          err.stderr = stderr
          reject(err)
          return
        }
        try {
          resolve(JSON.parse(stdout))
        } catch (parseErr) {
          reject(parseErr)
        }
      }
    )
    child.stdin?.end()
  })

const tagBatch = async (batch) => {
  const result = await runClaude(
    JSON.stringify(
      batch.map(({ id, title, summary, body }) => ({
        id,
        title,
        summary,
        body: body.slice(0, MAX_BODY_LENGTH),
      }))
    )
  )
  if (result.is_error)
    throw new Error(String(result.result ?? "").slice(0, 200))
  const text = String(result.result ?? "")
  // 出力後に自己訂正して2つ目のJSONを続けることがあるため、最後のオブジェクトを採用する(出力はネストしない)
  const parsed = JSON.parse(
    text.slice(text.lastIndexOf("{"), text.lastIndexOf("}") + 1)
  )
  for (const { id } of batch) {
    if (!Array.isArray(parsed[id])) throw new Error(`id ${id} が欠落`)
  }
  return parsed
}

const main = async () => {
  const contents = JSON.parse(readFileSync(contentsPath, "utf-8"))
  const targets = contents.filter(
    (content) =>
      content.type === "event" && (force || content.tags === undefined)
  )
  const batches = []
  for (let i = 0; i < targets.length; i += BATCH_SIZE)
    batches.push(targets.slice(i, i + BATCH_SIZE))

  let done = 0
  let failed = 0
  const worker = async () => {
    while (batches.length > 0) {
      const batch = batches.shift()
      try {
        const tags = await tagBatch(batch)
        for (const content of batch) content.tags = parseTags(tags[content.id])
        // 途中失敗しても付与済み分を失わないよう毎回保存
        writeFileSync(contentsPath, JSON.stringify(contents, null, 2) + "\n")
        done += batch.length
        console.log(
          batch
            .map((c) => `[OK] ${c.id} ${c.title} ${JSON.stringify(c.tags)}`)
            .join("\n")
        )
      } catch (err) {
        failed += batch.length
        console.log(
          `[ERROR] ${batch.map((c) => c.id).join(",")}: ${err.message}`
        )
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker))
  console.log(`\n--- サマリー --- 付与:${done} 失敗:${failed}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
