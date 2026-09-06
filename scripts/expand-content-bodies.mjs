// data/contents.json の既存bodyを、新事実を追加せず(捏造禁止)既存title/summary/bodyの情報のみで
// 6〜10文程度に書き伸ばす。claude CLI(headless)を1件ずつ呼び出す。
import { readFileSync, writeFileSync } from "fs"
import { fileURLToPath } from "url"
import { execFile } from "child_process"
import path from "path"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, "..")
const contentsPath = path.join(root, "data/contents.json")

const CLAUDE_TIMEOUT_MS = 120000
const MODEL = process.env.ANTHROPIC_MODEL || "sonnet"
const SLEEP_MS = 1000
const MIN_BODY_LEN = Number(process.env.MIN_BODY_LEN || 150)

const args = process.argv.slice(2)
const dryRun = args.includes("--dry-run")

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const readJson = (p) => JSON.parse(readFileSync(p, "utf-8"))
const writeJson = (p, data) => writeFileSync(p, JSON.stringify(data, null, 2) + "\n")

const SYSTEM_PROMPT = `あなたは地域メディア「浅草ライブ」の編集者。
与えられた記事(タイトル・要約・既存本文)を元に、本文を6〜10文程度に書き伸ばす。

厳守ルール:
- 与えられた情報に無い新しい事実(日付・場所・数量・固有名詞など)を作り出さない
- 既存の要約・本文に含まれる情報を、言い換え・詳細な言葉遣い・背景説明・読みどころの提示などで自然に膨らませるのみ
- 事実の水増しが不可能な場合は、文章の丁寧さ・情景描写・読者への呼びかけなど文体面で長さを補ってよい
- 出力は本文テキストのみ。説明文・マークダウン・見出し・箇条書き・引用符は一切含めない`

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
      { cwd: root, timeout: CLAUDE_TIMEOUT_MS, maxBuffer: 20 * 1024 * 1024 },
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

const expandBody = async (content) => {
  const userPrompt = `タイトル: ${content.title}
要約: ${content.summary}
既存本文: ${content.body}
カテゴリ: ${content.category}`
  const result = await runClaude(userPrompt)
  if (result.is_error) {
    throw new Error(String(result.result ?? "").slice(0, 200))
  }
  return String(result.result ?? "").trim()
}

const main = async () => {
  const contents = readJson(contentsPath)
  let updated = 0
  let skipped = 0
  let failed = 0

  for (let i = 0; i < contents.length; i++) {
    const content = contents[i]
    if ((content.body || "").length >= MIN_BODY_LEN) {
      skipped++
      continue
    }
    process.stdout.write(`[${i + 1}/${contents.length}] ${content.title} ... `)
    try {
      const newBody = await expandBody(content)
      if (newBody && newBody.length > content.body.length) {
        console.log(`${content.body.length} -> ${newBody.length}字`)
        if (!dryRun) content.body = newBody
        updated++
      } else {
        console.log("変化なし、スキップ")
        skipped++
      }
    } catch (err) {
      console.log(`[ERROR] ${err.message}`)
      failed++
    }
    await sleep(SLEEP_MS)
  }

  console.log(`\n--- サマリー --- 更新:${updated} スキップ:${skipped} 失敗:${failed}`)

  if (dryRun) {
    console.log("[dry-run] ファイルは更新していない")
    return
  }
  writeJson(contentsPath, contents)
  console.log("data/contents.json 更新完了")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
