// data/contents.json の既存bodyを、既存title/summary/body・出典ページ本文・場所情報のみを材料に
// (捏造禁止)書き伸ばす。claude CLI(headless)を1件ずつ呼び出す。
import { readFileSync, writeFileSync } from "fs"
import { fileURLToPath } from "url"
import { execFile } from "child_process"
import path from "path"
import * as cheerio from "cheerio"
import { UA } from "./lib/images.mjs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, "..")
const contentsPath = path.join(root, "data/contents.json")
const placesPath = path.join(root, "data/places.json")

const CLAUDE_TIMEOUT_MS = 240000
const MODEL = process.env.ANTHROPIC_MODEL || "sonnet"
const SLEEP_MS = 1000
const MIN_BODY_LEN = Number(process.env.MIN_BODY_LEN || 800)
const LIMIT = Number(process.env.LIMIT || Infinity)
const FETCH_TIMEOUT_MS = 15000
const MAX_SOURCE_TEXT = 6000

const args = process.argv.slice(2)
const dryRun = args.includes("--dry-run")

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const readJson = (p) => JSON.parse(readFileSync(p, "utf-8"))
const writeJson = (p, data) =>
  writeFileSync(p, JSON.stringify(data, null, 2) + "\n")

const SYSTEM_PROMPT = `あなたは地域メディア「浅草ライブ」の編集者。
与えられた材料(タイトル・要約・既存本文・出典ページ本文・場所情報)を元に、読み応えのある本文に書き直す。

厳守ルール:
- 材料に無い事実(日付・時間・料金・場所・数量・固有名詞・内容)を作り出さない。推測で補わない
- 出典ページ本文には他の記事の情報が混ざる場合がある。この記事の対象に関する情報だけを使う
- 出典ページから、内容・見どころ・出演者/商品/メニュー・料金・時間・申込方法・注意事項など具体的な情報を積極的に拾う
- 構成目安: 導入段落 → \`## \`見出し付きのセクション2〜4個(概要/見どころ/詳細/アクセス・基本情報など、材料がある分だけ) 。日時・料金・会場などの基本情報は箇条書きにまとめる。重要語は**強調**
- 材料が乏しい場合は無理に長くせず、文体の水増し・同じ内容の繰り返しをしない
- 記事タイトルと同じ見出しで始めない
- 文体は「だ・である」調で統一する
- 「出典ページによると」「〜と案内されている」など材料に言及するメタ表現、「〜と考えられる」「〜可能性がある」などの推測表現を使わない
- 出力はMarkdown形式の本文テキストのみ。前置きの説明文・引用符は一切含めない`

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

const sourceTextCache = new Map()

// 出典ページ本文を取得する。失敗時は空文字(既存材料のみで書く)
const fetchSourceText = async (url) => {
  if (!url) return ""
  if (!sourceTextCache.has(url)) {
    let text = ""
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const $ = cheerio.load(await res.text())
      $("script, style, noscript, svg, header, footer, nav").remove()
      text = $("body")
        .text()
        .replace(/[ \t]+/g, " ")
        .replace(/\n\s*\n+/g, "\n")
        .trim()
        .slice(0, MAX_SOURCE_TEXT)
    } catch (err) {
      process.stdout.write(`(出典取得失敗: ${err.message}) `)
    }
    sourceTextCache.set(url, text)
  }
  return sourceTextCache.get(url)
}

const expandBody = async (content, place) => {
  const sourceText = await fetchSourceText(content.source_url)
  const placeInfo = place
    ? [place.name, place.description, place.address, place.opening_hours]
        .filter(Boolean)
        .join(" / ")
    : ""
  const userPrompt = `タイトル: ${content.title}
要約: ${content.summary}
既存本文: ${content.body}
カテゴリ: ${content.category}
開催期間: ${content.start_at ?? ""}〜${content.end_at ?? ""}
場所情報: ${placeInfo}
出典ページ本文:
${sourceText}`
  const result = await runClaude(userPrompt)
  if (result.is_error) {
    throw new Error(String(result.result ?? "").slice(0, 200))
  }
  return String(result.result ?? "").trim()
}

const main = async () => {
  const contents = readJson(contentsPath)
  const places = new Map(readJson(placesPath).map((p) => [p.id, p]))
  let updated = 0
  let skipped = 0
  let failed = 0

  // 直近の記事から処理する(LIMIT指定時に新しい記事を優先するため)
  const ordered = [...contents].sort((a, b) =>
    b.published_at.localeCompare(a.published_at)
  )
  for (let i = 0; i < ordered.length; i++) {
    const content = ordered[i]
    if (
      updated + failed >= LIMIT ||
      (content.body || "").length >= MIN_BODY_LEN
    ) {
      skipped++
      continue
    }
    process.stdout.write(`[${i + 1}/${contents.length}] ${content.title} ... `)
    try {
      const newBody = await expandBody(content, places.get(content.place_id))
      if (newBody && newBody.length > content.body.length) {
        console.log(`${content.body.length} -> ${newBody.length}字`)
        if (dryRun) console.log(`${newBody}\n`)
        else {
          content.body = newBody
          // 中断しても進捗が残るよう1件ごとに保存する
          writeJson(contentsPath, contents)
        }
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

  console.log(
    `\n--- サマリー --- 更新:${updated} スキップ:${skipped} 失敗:${failed}`
  )

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
