// Webソースを巡回しClaude Code CLI(headless)でイベント・ニュースを抽出、data/contents.jsonへ新規追加
// 認証はCLAUDE_CODE_OAUTH_TOKEN または ANTHROPIC_API_KEY をclaude CLIが自動解決する
import { readFileSync, writeFileSync, mkdirSync, renameSync, unlinkSync } from "fs"
import { fileURLToPath } from "url"
import { execFile, execFileSync } from "child_process"
import path from "path"
import * as cheerio from "cheerio"
import { fetch as undiciFetch, Agent } from "undici"
import { extractImgCandidates, downloadImage, guessExt } from "./lib/images.mjs"
import { parseTags, THEME_RULE, THEMES } from "./lib/themes.mjs"
import { findDuplicate } from "./lib/dedupe.mjs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, "..")
const sourcesPath = path.join(root, "data/sources.json")
const placesPath = path.join(root, "data/places.json")
const contentsPath = path.join(root, "data/contents.json")
const imagesOutDir = path.join(root, "public/images/contents")

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
  "guide",
]

// lib/types.ts の AREAS と対応
const AREAS = {
  asakusa:
    "浅草(雷門・浅草寺周辺・仲見世・浅草六区・花川戸・西浅草・千束・浅草駅周辺を含む)",
  kuramae: "蔵前",
  tawaramachi: "田原町",
  inaricho: "稲荷町",
  asakusabashi: "浅草橋",
  honjoazumabashi: "本所吾妻橋",
  oshiage: "押上",
}

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

// 重複記事を検出した場合、破棄せず既存記事を更新する。
// - 出典URLは(既存と異なれば)source_urlsに追記して残す
// - 本文はより情報量の多い(長い)方を採用し内容を合わせて更新する
// - 既存の出典が一覧ページURLで、今回個別ページURLが得られた場合は出典を個別URLに差し替える
// - 開催日が既存側で欠けていれば補う
const mergeIntoExisting = (existing, candidate, source, listingUrl) => {
  let changed = false

  const knownUrls = new Set(
    [existing.source_url, ...(existing.source_urls ?? [])].filter(Boolean)
  )
  if (existing.source_url === listingUrl && source.url !== listingUrl) {
    existing.source_url = source.url
    changed = true
  } else if (!knownUrls.has(source.url)) {
    existing.source_urls = [...(existing.source_urls ?? []), source.url]
    changed = true
  }

  const candidateBody = candidate.body ?? candidate.summary ?? ""
  if (candidateBody.length > (existing.body?.length ?? 0)) {
    existing.summary = candidate.summary ?? existing.summary
    existing.body = candidateBody
    changed = true
  }

  const tags = parseTags([...(existing.tags ?? []), ...candidate.tags ?? []])
  if (tags.length !== (existing.tags ?? []).length) {
    existing.tags = tags
    changed = true
  }
  if (candidate.start_at && !existing.start_at) {
    existing.start_at = candidate.start_at
    changed = true
  }
  if (candidate.end_at && !existing.end_at) {
    existing.end_at = candidate.end_at
    changed = true
  }

  return changed
}

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

// RSSフィードを一覧ページ相当のHTMLに変換する(以降の抽出処理を共通化するため)
const rssToHtml = (xml) => {
  const $ = cheerio.load(xml, { xml: true })
  const items = $("item")
    .map((_, el) => {
      const item = $(el)
      const a = $("<a>").attr("href", item.find("link").text().trim())
      a.text(item.find("title").text())
      return `<p>${$.html(a)} ${item.find("pubDate").text()}</p>`
    })
    .get()
  return `<html><body>${items.join("\n")}</body></html>`
}

// Google ニュースの記事リンク(news.google.com/rss/articles/...)を元記事URLに変換する。失敗時はnull
const resolveGoogleNewsUrl = async (url) => {
  const id = new URL(url).pathname.split("/").pop()
  try {
    const html = await fetchHtml(url)
    const sg = html.match(/data-n-a-sg="([^"]+)"/)?.[1]
    const ts = html.match(/data-n-a-ts="([^"]+)"/)?.[1]
    if (!sg || !ts) return null
    const inner = JSON.stringify([
      "garturlreq",
      [["X", "X", ["X", "X"], null, null, 1, 1, "US:en", null, 1, null, null, null, null, null, 0, 1], "X", "X", 1, [1, 1, 1], 1, 1, null, 0, 0, null, 0],
      id,
      Number(ts),
      sg,
    ])
    const res = await fetch(
      "https://news.google.com/_/DotsSplashUi/data/batchexecute",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "User-Agent": UA,
        },
        body: new URLSearchParams({
          "f.req": JSON.stringify([[["Fbv4je", inner, null, "generic"]]]),
        }),
      }
    )
    const json = JSON.parse((await res.text()).split("\n\n")[1])
    const resolved = JSON.parse(json[0][2])[1]
    return /^https?:\/\//.test(resolved) ? resolved : null
  } catch (err) {
    console.warn(`  [WARN] Google ニュースURL解決失敗: ${err.message}`)
    return null
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

出力はJSON配列のみ。JSON全体を説明文やコードブロック(\`\`\`)で囲まない。該当情報がなければ空配列 [] を返す。

各要素のフォーマット:
{
  "type": "event または news",
  "title": "記事タイトル(【浅草】は含めない、簡潔に)",
  "summary": "1〜2文の要約",
  "body": "詳細本文(Markdown形式。背景・詳細・見どころなどを含め6〜10文程度でしっかり記述。段落は空行で区切り、必要に応じて見出し・強調・箇条書きなどのMarkdown記法を使ってよい)",
  "category": "${CATEGORIES.join(" | ")} のいずれか",
  "area": "${Object.keys(AREAS).join(" | ")} のいずれか",
  "tags": "${Object.keys(THEMES).join(" | ")} から該当するものの配列",
  "published_at": "YYYY-MM-DD",
  "start_at": "YYYY-MM-DD または null",
  "end_at": "YYYY-MM-DD または null",
  "place_name": "関連する店舗・施設名 または null",
  "image_index": "本文に最も合う画像候補の番号(整数) または該当なしならnull",
  "link_index": "その記事の個別詳細ページに当たるリンク候補の番号(整数) または該当なしならnull"
}

ルール:
- 浅草エリア(浅草・雷門・浅草寺周辺・仲見世・浅草六区・花川戸・西浅草・千束・浅草駅周辺・蔵前・田原町・稲荷町・浅草橋・本所吾妻橋・押上)に関係ない情報は除外する
- areaは記事の場所が属するエリア(${Object.entries(AREAS)
  .map(([key, name]) => `${key}=${name}`)
  .join("、")})。判断できない場合はasakusa
${THEME_RULE}
- 日付が不明な場合は推測せずnullにする
- 今日より前にend_atが過ぎているイベントは除外する
- トップページの案内文など一般的すぎる情報は抽出しない
- start_at/end_atのあるイベント系はtype="event"、それ以外はtype="news"
- image_indexは入力の「画像候補」リストから、その記事の内容(タイトル・見出し画像・alt文言)と最も合致するものを1つ選ぶ。ロゴやバナーなど記事と無関係なものは選ばない
- link_indexは入力の「リンク候補」リストから、その記事の個別詳細ページ(記事単体のページ)へのリンクを1つ選ぶ。カテゴリ一覧・ページ送り・外部サービス等は選ばない。リンク候補がない場合はnull`

// claude CLIをheadlessで呼び出す。認証(CLAUDE_CODE_OAUTH_TOKEN / ANTHROPIC_API_KEY)はCLIが環境変数から自動解決する
// stdinは即座にEOFを送る(繋がったままだとCLIが入力待ちと誤認し数秒遅延する)
const runClaude = (userPrompt, systemPrompt = EXTRACTION_SYSTEM_PROMPT) =>
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
        systemPrompt,
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

const runClaudeWithRetry = async (userPrompt, sourceId, systemPrompt) => {
  for (let attempt = 0; ; attempt++) {
    try {
      return await runClaude(userPrompt, systemPrompt)
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

const MAX_IMAGE_CANDIDATES = 20

// Claudeへの画像選択プロンプト用に候補一覧を整形する(ロゴ等は除外済みのものを渡す想定)
const formatImageCandidates = (candidates) =>
  candidates
    .slice(0, MAX_IMAGE_CANDIDATES)
    .map((c, i) => `${i}: ${c.url}${c.alt ? ` (alt: ${c.alt})` : ""}`)
    .join("\n")

const formatLinkCandidates = (candidates) =>
  candidates.map((c, i) => `${i}: ${c.text} (${c.url})`).join("\n")

// detail=true: 個別記事ページとして主題の記事1件のみ抽出させる
const extractContents = async (
  source,
  text,
  imgCandidates,
  today,
  { linkCandidates = [], detail = false } = {}
) => {
  if (!text) return []
  const imageBlock = imgCandidates.length
    ? `\n\n--- 画像候補 ---\n${formatImageCandidates(imgCandidates)}`
    : ""
  const linkBlock = linkCandidates.length
    ? `\n\n--- リンク候補 ---\n${formatLinkCandidates(linkCandidates)}`
    : ""
  const detailNote = detail
    ? "\n※このページは個別記事ページ。ページの主題となる記事1件のみを抽出する(関連記事・おすすめ等は除外)。"
    : ""
  const userPrompt = `情報源: ${source.name}
URL: ${source.url}
今日の日付: ${today}${detailNote}

--- ページ本文 ---
${text}${imageBlock}${linkBlock}`

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

const DEDUPE_SYSTEM_PROMPT = `あなたは地域メディア「浅草ライブ」の編集アシスタント。
今回新たに追加する記事が、既存記事(または今回追加する記事のうち番号の小さいもの)と同じ話題の重複かどうかを判定する。

出力はJSON配列1つのみ。説明文やコードブロック(\`\`\`)で囲まず、出力後の訂正もしない。重複がなければ空配列 [] を返す。
各要素: {"id": 新規記事の番号, "duplicate_of": 重複先の記事番号}

重複とみなすもの:
- 同じ催し・同じ店舗の開店/閉店・同じ商品発売・同じ発表を扱う記事(タイトルの言い回しや情報源が違っても同じ話題なら重複)

重複とみなさないもの:
- 同じシリーズ・定期公演でも回や開催日・期間が異なるもの
- 同じ施設・会場・ブランドでも別の催し・別の店舗・別の商品
- 既存記事の続報で新しい事実(追加開催・日程変更の発表・結果報告など)が主題のもの

判断に迷う場合は重複に含めない。duplicate_of には一覧にある番号のみを使い、新規記事どうしの場合は番号の小さい方を duplicate_of にする。`

// 新規記事と近い時期の既存記事を照合し、ヒューリスティックで拾えなかった重複を返す。失敗時は空配列
const findDuplicatesWithClaude = async (newItems, references, today) => {
  const line = (c) =>
    `${c.id}\t公開:${c.published_at}\t期間:${c.start_at ?? "-"}〜${c.end_at ?? "-"}\t${c.title}`
  const userPrompt = `今日の日付: ${today}

--- 今回追加する記事 ---
${newItems.map((c) => `${line(c)}\n\t要約: ${c.summary}`).join("\n")}

--- 既存記事 ---
${references.map(line).join("\n")}`

  try {
    const result = await runClaudeWithRetry(
      userPrompt,
      "dedupe",
      DEDUPE_SYSTEM_PROMPT
    )
    if (result.is_error) throw new Error(String(result.result ?? "").slice(0, 200))
    // 出力後に「訂正」として配列を出し直すことがあるため、最後に現れた配列を採用する
    const arrays = String(result.result ?? "").match(/\[[^[\]]*\]/g) ?? []
    const parsed = JSON.parse(arrays.at(-1) ?? "[]")
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.warn(`  [WARN] 重複照合失敗: ${err.message}`)
    return []
  }
}

// 選ばれた画像をダウンロードしpublic/images/contents/{id}.extへ保存、相対パスを返す
const saveContentImage = async (imageUrl, referer, id) => {
  const buf = await downloadImage(imageUrl, referer)
  if (!buf || buf.length < 2000) return null
  const ext = guessExt(imageUrl, null)
  const outPath = path.join(imagesOutDir, `${id}.${ext}`)
  writeFileSync(outPath, buf)
  return `/images/contents/${id}.${ext}`
}

// 最終照合で新規記事と突き合わせる既存記事の範囲(公開日がこの日数以内、または開催中・開催予定)
const DEDUPE_REFERENCE_DAYS = 45

const MAX_LINK_CANDIDATES = 100
const MAX_DETAIL_PAGES = 20

// 一覧ページ内のリンクを個別記事ページの候補として抽出する(ヘッダー・フッター・ナビは除外)
const extractLinkCandidates = (html, baseUrl) => {
  const $ = cheerio.load(html)
  $("header, footer, nav").remove()
  const base = new URL(baseUrl)
  base.hash = ""
  const seen = new Set()
  const links = []
  $("body a[href]").each((_, el) => {
    let url
    try {
      url = new URL($(el).attr("href"), baseUrl)
    } catch {
      return
    }
    if (!/^https?:$/.test(url.protocol)) return
    if (/\.(pdf|jpe?g|png|gif|webp|zip)$/i.test(url.pathname)) return
    url.hash = ""
    const text = $(el).text().replace(/\s+/g, " ").trim().slice(0, 80)
    if (text.length < 4 || url.href === base.href || seen.has(url.href)) return
    seen.add(url.href)
    links.push({ url: url.href, text })
  })
  return links.slice(0, MAX_LINK_CANDIDATES)
}

const main = async () => {
  if (!dryRun) mkdirSync(imagesOutDir, { recursive: true })
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
  let nextId = contents.reduce((max, c) => Math.max(max, c.id), 0) + 1
  const newContents = []
  const summary = {
    fetched: 0,
    failed: 0,
    extracted: 0,
    merged: 0,
    added: 0,
  }

  const findByUrl = (url) =>
    [...contents, ...newContents].find(
      (c) => c.source_url === url || c.source_urls?.includes(url)
    )

  const pickImage = async (imgCandidates, imgIndex, referer, id) => {
    if (
      typeof imgIndex !== "number" ||
      imgIndex < 0 ||
      imgIndex >= Math.min(imgCandidates.length, MAX_IMAGE_CANDIDATES)
    ) {
      return null
    }
    try {
      return dryRun
        ? imgCandidates[imgIndex].url
        : await saveContentImage(imgCandidates[imgIndex].url, referer, id)
    } catch (err) {
      console.warn(`  [WARN] 画像取得失敗: ${err.message}`)
      return null
    }
  }

  // page: 記事の取得元(個別ページならそのURL、一覧から直接抽出した場合は一覧URL)
  const mergeCandidate = async (
    existing,
    candidate,
    page,
    listingUrl,
    imgCandidates
  ) => {
    const changed = mergeIntoExisting(existing, candidate, page, listingUrl)
    if (!changed) return
    summary.merged++
    console.log(`  [MERGE] ${existing.title} ← ${candidate.title}`)
    if (!existing.image_url) {
      existing.image_url = await pickImage(
        imgCandidates,
        candidate.image_index,
        page.url,
        existing.id
      )
    }
  }

  const addCandidate = async (candidate, page, listingUrl, imgCandidates) => {
    if (!candidate.title || !CATEGORIES.includes(candidate.category)) return

    const duplicate = findDuplicate([...contents, ...newContents], candidate, page.id)
    if (duplicate) {
      await mergeCandidate(duplicate, candidate, page, listingUrl, imgCandidates)
      return
    }

    const id = nextId++
    const imageUrl = await pickImage(
      imgCandidates,
      candidate.image_index,
      page.url,
      id
    )
    const content = {
      id,
      type: candidate.type === "event" ? "event" : "news",
      title: candidate.title,
      summary: candidate.summary ?? "",
      body: candidate.body ?? candidate.summary ?? "",
      category: candidate.category,
      area: Object.hasOwn(AREAS, candidate.area ?? "")
        ? candidate.area
        : "asakusa",
      tags: parseTags(candidate.tags),
      published_at: candidate.published_at ?? today,
      start_at: candidate.start_at ?? null,
      end_at: candidate.end_at ?? null,
      place_id: findPlaceId(places, candidate.place_name),
      source_id: page.id,
      source_url: page.url,
      image_url: imageUrl,
    }
    newContents.push(content)
    summary.added++
    console.log(`  [NEW] ${content.title}${imageUrl ? " (画像あり)" : ""}`)
  }

  // 個別ページを取得し主題の記事1件を抽出する。取得・抽出に失敗した場合はnull、記事なしならcandidate=null
  const extractFromDetail = async (page) => {
    await sleep(SOURCE_INTERVAL_MS)
    console.log(`  取得中: ${page.url}`)
    try {
      const html = await fetchHtml(page.url)
      const imgCandidates = extractImgCandidates(html, page.url).filter(
        (c) => !c.excluded
      )
      const results = await extractContents(
        page,
        htmlToText(html),
        imgCandidates,
        today,
        { detail: true }
      )
      return { candidate: results[0] ?? null, imgCandidates }
    } catch (err) {
      console.warn(`  [WARN] 個別ページ取得失敗: ${err.message}`)
      return null
    }
  }

  for (const source of targetSources) {
    console.log(`[${source.id}] 取得中: ${source.url}`)

    let html
    try {
      html = await fetchHtml(source.url)
      if (/^\s*(<\?xml[^>]*>\s*)?<rss/.test(html)) html = rssToHtml(html)
      summary.fetched++
    } catch (err) {
      console.warn(`  [SKIP] 取得失敗: ${err.message}`)
      summary.failed++
      continue
    }

    const imgCandidates = extractImgCandidates(html, source.url).filter(
      (c) => !c.excluded
    )
    const linkCandidates = extractLinkCandidates(html, source.url)

    let candidates
    try {
      candidates = await extractContents(
        source,
        htmlToText(html),
        imgCandidates,
        today,
        { linkCandidates }
      )
    } catch (err) {
      console.warn(`  [SKIP] 抽出失敗: ${err.message}`)
      continue
    }
    summary.extracted += candidates.length

    // 個別ページがあれば取得してそちらを出典にする。取得失敗・記事なしの場合は一覧の抽出結果を使う
    const visited = new Set()
    for (const candidate of candidates) {
      let detailUrl = Number.isInteger(candidate.link_index)
        ? linkCandidates[candidate.link_index]?.url
        : null
      if (!candidate.title || !CATEGORIES.includes(candidate.category)) continue
      if (detailUrl?.startsWith("https://news.google.com/rss/articles/")) {
        detailUrl = await resolveGoogleNewsUrl(detailUrl)
      }

      // 既存記事があれば個別ページは取得せず、一覧で得た情報を既存記事に反映する
      const existing =
        (detailUrl && findByUrl(detailUrl)) ||
        findDuplicate([...contents, ...newContents], candidate, source.id)
      if (existing) {
        const page = detailUrl ? { ...source, url: detailUrl } : source
        await mergeCandidate(existing, candidate, page, source.url, imgCandidates)
        continue
      }

      if (
        !detailUrl ||
        visited.has(detailUrl) ||
        visited.size >= MAX_DETAIL_PAGES
      ) {
        await addCandidate(candidate, source, source.url, imgCandidates)
        continue
      }
      visited.add(detailUrl)

      const page = { ...source, url: detailUrl }
      const detail = await extractFromDetail(page)
      if (detail?.candidate) {
        await addCandidate(detail.candidate, page, source.url, detail.imgCandidates)
      } else {
        await addCandidate(candidate, source, source.url, imgCandidates)
      }
    }

    await sleep(SOURCE_INTERVAL_MS)
  }


  // 一覧・個別ページ単位の照合では、言い回しや情報源の違う同じ話題を拾いきれないため、最後にまとめて照合する
  if (newContents.length > 0) {
    console.log("\n[dedupe] 新規記事の重複照合中")
    const since = toDateString(new Date(Date.now() - DEDUPE_REFERENCE_DAYS * 86400000))
    const references = [
      ...contents.filter(
        (c) => c.published_at >= since || (c.end_at && c.end_at >= today)
      ),
      ...newContents,
    ]
    const pairs = await findDuplicatesWithClaude(newContents, references, today)
    const byId = new Map(references.map((c) => [c.id, c]))
    const newIds = new Set(newContents.map((c) => c.id))
    const mergedInto = new Map()
    // 新規どうしの連鎖(C→B→A)を解決できるよう番号の大きい方から統合する
    const valid = pairs
      .filter(
        (p) =>
          newIds.has(p?.id) &&
          byId.has(p?.duplicate_of) &&
          p.duplicate_of < p.id
      )
      .sort((a, b) => b.id - a.id)
    for (const { id, duplicate_of } of valid) {
      if (mergedInto.has(id)) continue
      const dup = byId.get(id)
      let target = byId.get(duplicate_of)
      while (mergedInto.has(target.id)) target = mergedInto.get(target.id)
      mergeIntoExisting(target, dup, { url: dup.source_url }, null)
      for (const url of dup.source_urls ?? []) {
        if (url !== target.source_url && !target.source_urls?.includes(url)) {
          target.source_urls = [...(target.source_urls ?? []), url]
        }
      }
      if (dup.image_url && !dryRun) {
        const from = path.join(root, "public", dup.image_url)
        if (!target.image_url) {
          const to = `/images/contents/${target.id}${path.extname(dup.image_url)}`
          renameSync(from, path.join(root, "public", to))
          target.image_url = to
        } else {
          unlinkSync(from)
        }
      } else if (dup.image_url && !target.image_url) {
        target.image_url = dup.image_url
      }
      newContents.splice(newContents.indexOf(dup), 1)
      mergedInto.set(id, target)
      summary.added--
      summary.merged++
      console.log(`  [MERGE] ${target.id} ${target.title} ← ${dup.id} ${dup.title}`)
    }
  }

  console.log("\n--- サマリー ---")
  console.log(`source取得成功: ${summary.fetched} / 失敗: ${summary.failed}`)
  console.log(
    `抽出候補: ${summary.extracted} / 重複統合: ${summary.merged} / 新規追加: ${summary.added}`
  )

  if (dryRun) {
    console.log("\n[dry-run] ファイルは更新していない")
    return
  }

  if (newContents.length > 0 || summary.merged > 0) {
    writeJson(contentsPath, [...contents, ...newContents])
    console.log(
      `\ndata/contents.json を更新(新規${newContents.length}件・統合${summary.merged}件)`
    )
    // 新規記事(未翻訳分)を続けて翻訳する
    execFileSync(
      process.execPath,
      [path.join(__dirname, "translate-contents.mjs")],
      { stdio: "inherit" }
    )
  } else {
    console.log("\n更新なし")
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
