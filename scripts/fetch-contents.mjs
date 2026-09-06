// Webソースを巡回しClaude Code CLI(headless)でイベント・ニュースを抽出、data/contents.jsonへ新規追加
// 認証はCLAUDE_CODE_OAUTH_TOKEN または ANTHROPIC_API_KEY をclaude CLIが自動解決する
import { readFileSync, writeFileSync } from "fs"
import { fileURLToPath } from "url"
import { randomUUID } from "crypto"
import { execFile } from "child_process"
import path from "path"
import * as cheerio from "cheerio"
import { fetch as undiciFetch, Agent } from "undici"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, "..")
const sourcesPath = path.join(root, "data/sources.json")
const placesPath = path.join(root, "data/places.json")
const contentsPath = path.join(root, "data/contents.json")

const CATEGORIES = [
  "event",
  "festival",
  "performance",
  "new_opening",
  "closing",
  "renewal",
  "sale",
  "campaign",
  "popup",
  "new_product",
  "exhibition",
  "facility_news",
  "local_news",
]

const MAX_TEXT_LENGTH = 15000
const FETCH_TIMEOUT_MS = 15000
const CLAUDE_TIMEOUT_MS = 240000
const SOURCE_INTERVAL_MS = 3000
const RETRY_DELAYS_MS = [10000, 30000, 60000]
const MODEL = process.env.ANTHROPIC_MODEL || "sonnet"

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"

const args = process.argv.slice(2)
const dryRun = args.includes("--dry-run")
const sourceArg = args.find((a) => a.startsWith("--source="))
const onlySourceId = sourceArg ? sourceArg.slice("--source=".length) : null

const readJson = (filePath) => JSON.parse(readFileSync(filePath, "utf-8"))
const writeJson = (filePath, data) =>
  writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n")

const toDateString = (date) => {
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, "0")
  const d = `${date.getDate()}`.padStart(2, "0")
  return `${y}-${m}-${d}`
}

const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)

const generateId = (sourceId, title) =>
  `${sourceId}-${slugify(title) || "content"}-${randomUUID().slice(0, 8)}`

const normalizeTitle = (title) => title.replace(/\s+/g, "").toLowerCase()

const isDuplicate = (existing, candidate, sourceId) =>
  existing.some(
    (c) =>
      c.source_id === sourceId &&
      normalizeTitle(c.title) === normalizeTitle(candidate.title) &&
      (!candidate.start_at || !c.start_at || candidate.start_at === c.start_at)
  )

const findPlaceId = (places, placeName) => {
  const name = placeName?.trim()
  if (!name) return null
  const exact = places.find((p) => p.name === name)
  if (exact) return exact.id
  const partial = places.find(
    (p) => name.includes(p.name) || p.name.includes(name)
  )
  return partial ? partial.id : null
}

// ekimise.jpはサーバー証明書チェーンの不備(leafはCybertrust G4発行だが中間証明書が旧G3のまま)でTLS検証が通らない。
// プロセス全体には影響させず、このホスト向けリクエストに限定したdispatcherで検証を無効化する
const INSECURE_TLS_HOSTS = new Set(["www.ekimise.jp"])
const insecureDispatcher = new Agent({ connect: { rejectUnauthorized: false } })

const fetchHtml = async (url) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  const insecure = INSECURE_TLS_HOSTS.has(new URL(url).hostname)
  // Node組み込みfetchのdispatcherにはundiciパッケージ側のAgentは渡せない(実体が別物)ため、
  // insecureホストのみundiciパッケージ自身のfetchを使う
  const doFetch = insecure ? undiciFetch : fetch
  try {
    const res = await doFetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": UA },
      ...(insecure ? { dispatcher: insecureDispatcher } : {}),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.text()
  } finally {
    clearTimeout(timer)
  }
}

const htmlToText = (html) => {
  const $ = cheerio.load(html)
  $("script, style, noscript, svg, header, footer, nav").remove()
  return $("body")
    .text()
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim()
    .slice(0, MAX_TEXT_LENGTH)
}

const EXTRACTION_SYSTEM_PROMPT = `あなたは地域メディア「浅草ライブ」の情報抽出アシスタント。
Webページのテキストから、浅草エリアのイベント・新規オープン・閉店・セール・キャンペーン・POP UP・展示会・地域ニュースなどの記事候補を抽出する。

出力はJSON配列のみ。説明文・マークダウンのコードブロックは一切含めない。該当情報がなければ空配列 [] を返す。

各要素のフォーマット:
{
  "type": "event または news",
  "title": "記事タイトル(【浅草】は含めない、簡潔に)",
  "summary": "1〜2文の要約",
  "body": "詳細本文(背景・詳細・見どころなどを含め6〜10文程度でしっかり記述)",
  "category": "${CATEGORIES.join(" | ")} のいずれか",
  "published_at": "YYYY-MM-DD",
  "start_at": "YYYY-MM-DD または null",
  "end_at": "YYYY-MM-DD または null",
  "place_name": "関連する店舗・施設名 または null"
}

ルール:
- 浅草エリアに関係ない情報は除外する
- 日付が不明な場合は推測せずnullにする
- 今日より前にend_atが過ぎているイベントは除外する
- トップページの案内文など一般的すぎる情報は抽出しない
- start_at/end_atのあるイベント系はtype="event"、それ以外はtype="news"`

// claude CLIをheadlessで呼び出す。認証(CLAUDE_CODE_OAUTH_TOKEN / ANTHROPIC_API_KEY)はCLIが環境変数から自動解決する
// stdinは即座にEOFを送る(繋がったままだとCLIが入力待ちと誤認し数秒遅延する)
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
        EXTRACTION_SYSTEM_PROMPT,
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

const runClaudeWithRetry = async (userPrompt, sourceId) => {
  for (let attempt = 0; ; attempt++) {
    try {
      return await runClaude(userPrompt)
    } catch (err) {
      const isTimeout = err?.killed === true || err?.signal === "SIGTERM"
      const message = err?.stderr || err?.message || String(err)
      const isRateLimited = /429|rate_limit/i.test(message)
      const reason = isTimeout ? "timeout" : isRateLimited ? "rate_limit" : null
      if (reason && attempt < RETRY_DELAYS_MS.length) {
        const wait = RETRY_DELAYS_MS[attempt]
        console.warn(
          `  [RETRY] ${sourceId}: ${reason}、${wait / 1000}秒待機後再試行 (${attempt + 1}/${RETRY_DELAYS_MS.length})`
        )
        await sleep(wait)
        continue
      }
      console.warn(
        `  [ERROR] ${sourceId}: code=${err?.code} killed=${err?.killed} signal=${err?.signal} ${message.slice(0, 200)}`
      )
      throw err
    }
  }
}

const extractContents = async (source, text, today) => {
  if (!text) return []
  const userPrompt = `情報源: ${source.name}
URL: ${source.url}
今日の日付: ${today}

--- ページ本文 ---
${text}`

  const result = await runClaudeWithRetry(userPrompt, source.id)

  if (result.is_error) {
    console.warn(
      `  [WARN] Claude実行エラー: ${String(result.result ?? "").slice(0, 200)}`
    )
    return []
  }

  const raw = String(result.result ?? "")
    .trim()
    .replace(/^```(?:json)?\n?/, "")
    .replace(/\n?```$/, "")
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    console.warn(`  [WARN] JSON解析失敗: ${source.id}`)
    return []
  }
}

const main = async () => {
  const sources = readJson(sourcesPath)
  const places = readJson(placesPath)
  const contents = readJson(contentsPath)

  const targetSources = onlySourceId
    ? sources.filter((s) => s.id === onlySourceId)
    : sources
  if (targetSources.length === 0) {
    console.error(`source not found: ${onlySourceId}`)
    process.exit(1)
  }

  const today = toDateString(new Date())
  const newContents = []
  const summary = {
    fetched: 0,
    failed: 0,
    extracted: 0,
    duplicate: 0,
    added: 0,
  }

  for (const source of targetSources) {
    console.log(`[${source.id}] 取得中: ${source.url}`)

    let html
    try {
      html = await fetchHtml(source.url)
      summary.fetched++
    } catch (err) {
      console.warn(`  [SKIP] 取得失敗: ${err.message}`)
      summary.failed++
      continue
    }

    let candidates
    try {
      candidates = await extractContents(source, htmlToText(html), today)
    } catch (err) {
      console.warn(`  [SKIP] 抽出失敗: ${err.message}`)
      continue
    }
    summary.extracted += candidates.length

    for (const candidate of candidates) {
      if (!candidate.title || !CATEGORIES.includes(candidate.category)) continue
      if (isDuplicate([...contents, ...newContents], candidate, source.id)) {
        summary.duplicate++
        continue
      }

      const content = {
        id: generateId(source.id, candidate.title),
        type: candidate.type === "event" ? "event" : "news",
        title: candidate.title,
        summary: candidate.summary ?? "",
        body: candidate.body ?? candidate.summary ?? "",
        category: candidate.category,
        published_at: candidate.published_at ?? today,
        start_at: candidate.start_at ?? null,
        end_at: candidate.end_at ?? null,
        place_id: findPlaceId(places, candidate.place_name),
        source_id: source.id,
        source_url: source.url,
        image_url: null,
      }
      newContents.push(content)
      summary.added++
      console.log(`  [NEW] ${content.title}`)
    }

    await sleep(SOURCE_INTERVAL_MS)
  }

  console.log("\n--- サマリー ---")
  console.log(`source取得成功: ${summary.fetched} / 失敗: ${summary.failed}`)
  console.log(
    `抽出候補: ${summary.extracted} / 重複除外: ${summary.duplicate} / 新規追加: ${summary.added}`
  )

  if (dryRun) {
    console.log("\n[dry-run] ファイルは更新していない")
    return
  }

  if (newContents.length > 0) {
    writeJson(contentsPath, [...contents, ...newContents])
    console.log(`\ndata/contents.json に ${newContents.length} 件追加`)
  } else {
    console.log("\n新規記事なし")
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
