// 記事のテーマタグ(lib/types.ts の THEMES と対応)。fetch-contents.mjs / tag-contents.mjs 共用
export const THEMES = {
  free: "入場・参加・観覧が無料(無料登録・割引・一部撮影のみ無料などは除く)",
  kids: "子ども・親子・家族向けの内容がある(子供料金の設定があるだけの場合は除く)",
  workshop:
    "伝統文化・ものづくり・農業などを参加者が自分の手で作る・体験するワークショップや体験企画がある(展示や公演を見るだけ、抽選・くじ・物販、ヨガ・フィットネス等の運動レッスンは除く)",
  night:
    "夜(おおむね17時以降)の開催・夜の部・ライトアップ・夜景が主な見どころの一つ(夜まで営業しているだけ、作品やタイトルに「夜」が含まれるだけは除く)",
}

export const THEME_RULE = `- tagsは次の条件に明確に当てはまるものだけを配列で選ぶ(該当なしは[]): ${Object.entries(
  THEMES
)
  .map(([key, desc]) => `${key}=${desc}`)
  .join("、")}`

export const parseTags = (tags) =>
  Array.isArray(tags)
    ? [...new Set(tags)].filter((tag) => Object.hasOwn(THEMES, tag))
    : []
