// data/contents.json・data/places.json を英語・簡体字中国語に翻訳し data/translations/{en,zh}.json に保存する。
// 直近の記事(未終了のイベント + RECENT_DAYS日以内に公開)のうち未翻訳のものだけ処理する
// (--force で対象を全件やり直し)。claude CLI(headless)を1件ずつ呼び出す。
import { existsSync, readFileSync, writeFileSync } from "fs"
import { fileURLToPath } from "url"
import { execFile } from "child_process"
import path from "path"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, "..")
const LOCALES = ["en", "zh"]

const CLAUDE_TIMEOUT_MS = 180000
const MODEL = process.env.ANTHROPIC_MODEL || "sonnet"
const CONCURRENCY = Number(process.env.CONCURRENCY || 4)
const RECENT_DAYS = Number(process.env.RECENT_DAYS || 30)
const DAY_MS = 24 * 60 * 60 * 1000
// サイト側(lib/date.ts)と同じくJST基準の日付
const jstDate = (offsetDays = 0) =>
  new Date(Date.now() + 9 * 60 * 60 * 1000 + offsetDays * DAY_MS)
    .toISOString()
    .slice(0, 10)
const today = jstDate()
const since = jstDate(-RECENT_DAYS)
const isRecent = (content) =>
  (content.end_at ?? content.start_at ?? "") >= today ||
  content.published_at >= since

const args = process.argv.slice(2)
const force = args.includes("--force")
const limit =
  Number(args.find((arg) => arg.startsWith("--limit="))?.slice(8)) || Infinity

const readJson = (p) => JSON.parse(readFileSync(p, "utf-8"))
const writeJson = (p, data) =>
  writeFileSync(p, JSON.stringify(data, null, 2) + "\n")
const translationPath = (locale) =>
  path.join(root, `data/translations/${locale}.json`)
const loadTranslation = (locale) =>
  existsSync(translationPath(locale))
    ? readJson(translationPath(locale))
    : { contents: {}, places: {} }

const SYSTEM_PROMPT = `あなたは浅草の地域メディア「浅草ライブ」の翻訳者。
与えられたJSONの各値を、訪日観光客向けに英語(en)と簡体字中国語(zh)へ翻訳する。

厳守ルール:
- 原文に無い情報を追加・削除しない。日付・時刻・数量・URLは原文どおり
- 固有名詞は一般的な表記に(例: 浅草寺→Senso-ji / 浅草寺、雷門→Kaminarimon / 雷门、仲見世→Nakamise / 仲见世)。定着した表記が無い店名等はローマ字(en)・原文漢字の簡体字化(zh)
- 住所は en: 英語住所表記(例: 2-3-1 Asakusa, Taito-ku, Tokyo)、zh: 简体字
- Markdown記法は原文の構造を維持する
- null の値は null のまま
- 出力は {"en": {...}, "zh": {...}} のJSONのみ。キーは入力と同じ。前置き・コードフェンス禁止`

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

const translate = async (fields) => {
  const result = await runClaude(JSON.stringify(fields))
  if (result.is_error)
    throw new Error(String(result.result ?? "").slice(0, 200))
  // 前後に説明文やコードフェンスが付いても最外の{}だけを取り出す
  const text = String(result.result ?? "")
  const parsed = JSON.parse(
    text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)
  )
  for (const locale of LOCALES) {
    for (const key of Object.keys(fields)) {
      if (fields[key] !== null && typeof parsed[locale]?.[key] !== "string")
        throw new Error(`${locale}.${key} が欠落`)
    }
  }
  return parsed
}

const main = async () => {
  const translations = Object.fromEntries(
    LOCALES.map((locale) => [locale, loadTranslation(locale)])
  )
  const pick = (item, keys) =>
    Object.fromEntries(keys.map((key) => [key, item[key] ?? null]))
  const jobs = [
    ...readJson(path.join(root, "data/places.json")).map((place) => ({
      kind: "places",
      id: place.id,
      label: place.name,
      fields: pick(place, [
        "name",
        "description",
        "address",
        "opening_hours",
        "area",
      ]),
    })),
    ...readJson(path.join(root, "data/contents.json"))
      .filter(isRecent)
      .map((content) => ({
        kind: "contents",
        id: String(content.id),
        label: content.title,
        fields: pick(content, ["title", "summary", "body"]),
      })),
  ]
    .filter(
      ({ kind, id }) =>
        force || LOCALES.some((locale) => !translations[locale][kind][id])
    )
    .slice(0, limit)

  let done = 0
  let failed = 0
  const worker = async () => {
    while (jobs.length > 0) {
      const job = jobs.shift()
      try {
        const result = await translate(job.fields)
        for (const locale of LOCALES) {
          translations[locale][job.kind][job.id] = result[locale]
          // 途中失敗しても翻訳済み分を失わないよう毎回保存
          writeJson(translationPath(locale), translations[locale])
        }
        done++
        console.log(`[OK] ${job.kind}/${job.id} ${job.label}`)
      } catch (err) {
        failed++
        console.log(
          `[ERROR] ${job.kind}/${job.id} ${job.label}: ${err.message}`
        )
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker))
  console.log(`\n--- サマリー --- 翻訳:${done} 失敗:${failed}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
