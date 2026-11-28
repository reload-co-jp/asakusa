// 記事候補の重複判定(fetch-contents.mjs から利用)

// 空白・括弧・記号は表記揺れとして無視する
export const normalizeTitle = (title) =>
  title.normalize("NFKC").replace(/[\s\p{P}\p{S}]/gu, "").toLowerCase()

// タイトルのbigram類似度(0〜1)。表記揺れ(全角/半角の括弧・句読点、語順の入れ替え程度)を
// 同一記事として吸収するための緩い指標。完全一致(=1)以外は閾値で判定する
const DUP_TITLE_SIM_THRESHOLD = 0.5
// ソース横断は「〇〇がオープン」等の短い定型タイトル同士が0.5を超えるため厳しめにする
const DUP_TITLE_SIM_THRESHOLD_CROSS_SOURCE = 0.6

const bigrams = (s) => {
  const set = new Set()
  for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2))
  return set
}

export const titleSimilarity = (a, b) => {
  const A = bigrams(normalizeTitle(a))
  const B = bigrams(normalizeTitle(b))
  if (A.size === 0 || B.size === 0) return 0
  let inter = 0
  for (const x of A) if (B.has(x)) inter++
  return (inter * 2) / (A.size + B.size)
}

// 一方のタイトルが他方を含む場合(施設名等の前置きの有無)も同一記事とみなす
const titleContains = (a, b) => {
  const A = normalizeTitle(a)
  const B = normalizeTitle(b)
  return Math.min(A.length, B.length) >= 6 && (A.includes(B) || B.includes(A))
}

// 「9月の休診日」「10月の休診日」のように月だけ異なる定期告知は別記事とみなす
const monthsOf = (title) =>
  (title.normalize("NFKC").match(/\d+月/g) ?? []).sort().join(",")
const monthsConflict = (a, b) => {
  const A = monthsOf(a)
  const B = monthsOf(b)
  return A !== "" && B !== "" && A !== B
}

// タイトル中の固有名らしき語(括弧内の名称・英字名)。カタカナ語は「ショップ」「センター」等の一般語と区別できないため対象外
// 生成AIのタイトルは言い回しが毎回揺れるため(「浅草ROX 1F特設会場に「Atelier de Ulala」が期間限定オープン」と
// 「ROX Atelier de Ulala 手描き一点物の服・雑貨ポップアップ」など)、全体の類似度では拾えない重複を店名・催事名で照合する
const MIN_KEY_TERM_LENGTH = 3
export const keyTerms = (title) => {
  const t = title.normalize("NFKC")
  const terms = new Set()
  const add = (s) => {
    const n = normalizeTitle(s)
    if (n.length >= MIN_KEY_TERM_LENGTH) terms.add(n)
  }
  for (const m of t.matchAll(/[「『“"]([^」』”"]+)[」』”"]/g)) add(m[1])
  // 英字は2語以上の名称のみ。1語(「Bounce」「CAMSHOP」等)はブランド名で、同ブランドの別の告知と区別できない
  for (const m of t.matchAll(/[A-Za-z][A-Za-z0-9'’&.-]*(?: [A-Za-z0-9'’&.-]+)+/g)) {
    if (m[0].replace(/[^A-Za-z]/g, "").length >= 5) add(m[0])
  }
  return terms
}

// 「ROX Atelier de Ulala」と「Atelier de Ulala」のように前後に施設名等が付いた表記も一致とみなす
const MIN_TERM_CONTAINS_LENGTH = 6
const termsMatch = (a, b) =>
  a === b ||
  (Math.min(a.length, b.length) >= MIN_TERM_CONTAINS_LENGTH &&
    (a.includes(b) || b.includes(a)))

// 固有名の照合は、多くの記事に出てくる語(施設名・「期間限定ショップ」等)を除くため既存記事での出現数で絞る
const MAX_KEY_TERM_DF = 3
// 同じ店・催事でも公開日が離れていれば別の告知(続報・別店舗の出店等)とみなす。
// 実際の重複(同じ告知を別ソース・再クロールで拾ったもの)は公開日の差が数日以内に収まる
const KEY_TERM_WINDOW_DAYS = 10
const KEY_TERM_SCORE = 0.9

const daysBetween = (a, b) =>
  Math.abs(new Date(a).getTime() - new Date(b).getTime()) / 86400000

// 開始日・終了日のどちらかが一致すれば同一の催事とみなす(主催側の日程変更で開始日だけ変わることがある)
const periodConflict = (a, b) => {
  const startDiffers = a.start_at && b.start_at && a.start_at !== b.start_at
  if (!startDiffers) return false
  return !(a.end_at && b.end_at && a.end_at === b.end_at)
}

const termDocumentFrequency = (existing) => {
  const df = new Map()
  for (const c of existing) {
    for (const term of keyTerms(c.title)) df.set(term, (df.get(term) ?? 0) + 1)
  }
  return df
}

// 同一ソースを日を変えて再クロールした際、生成AIの言い回しが毎回微妙に揺れることで
// 完全一致では検出できない重複記事が発生する。同一source_id・同一開催日(あれば)を前提に、
// タイトルの類似度で同一記事とみなせるものを既存contentsから探す。
// 「〇〇 浅草ROX・3Gに新規オープン」のように定型部分が共通する別記事もあるため、最も類似度の高いものを選ぶ
// google-news等の集約ソースは他ソースと同じ記事を拾うため、同一カテゴリならソース横断で照合する
// 店名・催事名(keyTerms)が一致する場合は、ソース・カテゴリを問わず近い時期の記事を同一とみなす
export const findDuplicate = (existing, candidate, sourceId, df = termDocumentFrequency(existing)) => {
  const candidateTerms = [...keyTerms(candidate.title)].filter(
    (term) => (df.get(term) ?? 0) <= MAX_KEY_TERM_DF
  )
  let best = null
  let bestScore = 0
  for (const c of existing) {
    if (periodConflict(candidate, c)) continue
    if (monthsConflict(c.title, candidate.title)) continue

    let score = 0
    if (c.source_id === sourceId || c.category === candidate.category) {
      score = titleContains(c.title, candidate.title)
        ? 1
        : titleSimilarity(c.title, candidate.title)
      const threshold =
        c.source_id === sourceId
          ? DUP_TITLE_SIM_THRESHOLD
          : DUP_TITLE_SIM_THRESHOLD_CROSS_SOURCE
      if (score < threshold) score = 0
    }

    const near =
      !candidate.published_at ||
      !c.published_at ||
      daysBetween(candidate.published_at, c.published_at) <= KEY_TERM_WINDOW_DAYS
    if (score < KEY_TERM_SCORE && near && candidateTerms.length > 0) {
      const terms = [...keyTerms(c.title)].filter(
        (term) => (df.get(term) ?? 0) <= MAX_KEY_TERM_DF
      )
      if (candidateTerms.some((a) => terms.some((b) => termsMatch(a, b)))) {
        score = KEY_TERM_SCORE
      }
    }

    if (score > bestScore) {
      best = c
      bestScore = score
    }
  }
  return best
}
