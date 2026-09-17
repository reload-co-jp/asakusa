// data/contents.json のうち開催中・開催前(start_atがありend_atが未到来 or 未設定)のcontentについて、
// 既存bodyの内容・情報量を変えずMarkdown形式に整形しなおす。claude CLI(headless)を1件ずつ呼び出す。
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

const args = process.argv.slice(2)
const dryRun = args.includes("--dry-run")

const toDateString = (date) => {
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, "0")
  const d = `${date.getDate()}`.padStart(2, "0")
  return `${y}-${m}-${d}`
}
const today = toDateString(new Date())

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const readJson = (p) => JSON.parse(readFileSync(p, "utf-8"))
const writeJson = (p, data) => writeFileSync(p, JSON.stringify(data, null, 2) + "\n")

const isOngoingOrUpcoming = (content) =>
  Boolean(content.start_at) && (!content.end_at || content.end_at >= today)

// 既に見出し・強調・箇条書きなどMarkdown記法を含む本文は変換済みとみなす
const looksLikeMarkdown = (body) => /(^#{1,6}\s|\*\*[^*]+\*\*|^[-*]\s|\n\n)/m.test(body || "")

const SYSTEM_PROMPT = `あなたは地域メディア「浅草ライブ」の編集者。
与えられた記事本文(プレーンテキスト)を、Markdown形式に整形しなおす。

厳守ルール:
- 文章の意味・情報量・言い回しを変えない。新しい事実を追加も削除もしない
- 単なる整形作業。段落は空行で区切り、内容に応じて見出し(##)・強調(**)・箇条書きなどのMarkdown記法を必要な範囲で付与してよい
- 記法を無理に詰め込まない。地の文のままで自然なら段落分けのみでよい
- 出力はMarkdown形式の本文テキストのみ。前置きの説明文・引用符・コードブロック(\`\`\`)は一切含めない`

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

const markdownifyBody = async (content) => {
  const userPrompt = `タイトル: ${content.title}
既存本文: ${content.body}`
  const result = await runClaude(userPrompt)
  if (result.is_error) {
    throw new Error(String(result.result ?? "").slice(0, 200))
  }
  return String(result.result ?? "").trim()
}

const main = async () => {
  const contents = readJson(contentsPath)
  const targets = contents.filter(isOngoingOrUpcoming)
  console.log(`対象(開催中・開催前): ${targets.length} / 全体: ${contents.length}`)

  let updated = 0
  let skipped = 0
  let failed = 0

  for (let i = 0; i < targets.length; i++) {
    const content = targets[i]
    if (looksLikeMarkdown(content.body)) {
      skipped++
      continue
    }
    process.stdout.write(`[${i + 1}/${targets.length}] ${content.title} ... `)
    try {
      const newBody = await markdownifyBody(content)
      if (newBody) {
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
