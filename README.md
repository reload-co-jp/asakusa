# 浅草ライブ

浅草地域メディア

URL: https://asakusa.reload.co.jp

## 1. 目的

浅草エリアのイベント・新店舗・閉店・セール・キャンペーン・POP UP・公演・祭り・地域ニュースなどをWebから収集し、店舗・施設・スポット・イベントを構造化して記事を生成する。

## 2. 対象エリア

- 浅草
- 雷門
- 浅草寺周辺
- 仲見世
- 浅草六区
- 花川戸
- 西浅草
- 千束
- 浅草駅周辺

## 3. 情報源

### 公的・地域情報

- 台東区: https://www.city.taito.lg.jp/
- 台東区イベント: https://www.city.taito.lg.jp/bunka_kanko/event/index.html
- 浅草文化観光センター: https://www.city.taito.lg.jp/bunka_kanko/kankoinfo/info/oyakudachi/kankocenter/index.html
- 浅草観光連盟: https://e-asakusa.jp/

### 寺社・季節行事

- 浅草寺 年中行事: https://www.senso-ji.jp/annual_event/
- 浅草神社: https://asakusajinja.jp/
  - 年間祭典・三社祭・お知らせを収集対象とする

### イベント・公演

- 浅草公会堂 催し物: https://asakusa-koukaidou.net/home/event.html
- 浅草演芸ホール スケジュール: https://www.asakusaengei.com/schedule/
- 浅草花やしき イベント・ステージ: https://www.hanayashiki.net/event_this/
- 浅草花やしき ステージ: https://www.hanayashiki.net/stage/

### 商業施設

- 浅草ROX 最新情報: https://www.rox.co.jp/news/
- 浅草エキミセ: https://www.ekimise.jp/
- 松屋浅草: https://www.matsuya.com/asakusa/
- 浅草地下街: https://asakusa-chikagai.com/

### プレスリリース

- PR TIMES「浅草」検索: https://prtimes.jp/main/action.php?run=html&page=searchkey&search_word=%E6%B5%85%E8%8D%89

### 店舗情報

- 食べログ 浅草: https://tabelog.com/tokyo/A1311/A131102/
- 食べログ 浅草・新規オープン: https://tabelog.com/tokyo/A1311/A131102/rstLst/cond16-00-00/

### 情報源の扱い

- 公式サイトを一次情報として優先する
- 商業施設はトップページではなく、イベント・ニュース等の更新ページを優先する
- 公演施設は月別スケジュールを定期取得する
- 食べログ等は新店舗候補の発見に利用し、開店日・住所・営業時間は公式情報で再確認する
- イベントプラットフォームは補完情報として利用する
- 取得URL・取得日時・source_typeを保存する

## 4. 情報収集フロー

```text
Webサイト
  ↓
スクレイピング
  ↓
Rawデータ保存
  ↓
情報抽出
  ↓
イベント・店舗・施設などに分類
  ↓
重複チェック
  ↓
Entityと紐付け
  ↓
記事生成
  ↓
確認
  ↓
公開
```

## 5. 情報カテゴリ

- `event` - イベント
- `festival` - 祭り・季節行事
- `performance` - 公演・演芸
- `new_opening` - 新規オープン
- `closing` - 閉店
- `renewal` - リニューアル
- `sale` - セール
- `campaign` - キャンペーン
- `popup` - POP UP
- `new_product` - 新商品
- `exhibition` - 展示会
- `facility_news` - 施設ニュース
- `local_news` - 地域ニュース

## 6. 管理する情報

### Place（店舗・施設・スポット）

店舗・施設・スポットを1つの型で管理する。

```text
places
- id
- name
- type
- description
- address
- latitude
- longitude
- opening_hours
- phone
- url
- image_url
- area
- source_id
- source_url
```

`type` の例:

- store
- facility
- temple
- shrine
- museum
- theater
- park
- tourist_spot
- other

### Content（イベント・ニュース）

イベント・ニュースを1つの型で管理する。

```text
contents
- id
- type
- title
- summary
- body
- category
- published_at
- start_at
- end_at
- place_id
- source_id
- source_url
```

`type`:

- `event`
- `news`

イベントの場合は `start_at` / `end_at` / `place_id` を使用し、ニュースの場合は `published_at` を中心に管理する。

### 関係

```text
Place
  └── Content

Content
  ├── Event
  └── News
```

例:

````text
浅草ROX（Place）
  ├── 夏祭り（Content / Event）
  ├── セール（Content / News）
  ├── 新店舗オープン（Content / News）
  └── POP UP（Content / Event）

同じEntityに複数の情報源を紐付ける。

## 7. LLMによる情報抽出

スクレイピングした情報から構造化データを生成する。

```json
{
  "category": "event",
  "title": "○○イベント",
  "area": "浅草",
  "place": "浅草ROX",
  "start_at": "2026-09-10",
  "end_at": "2026-09-20",
  "summary": "..."
}
````

## 8. 記事生成

### 新店舗

```text
【浅草】○○が○月○日にオープン！

概要

店舗情報
- 店名
- 住所
- 営業時間
- オープン日
- アクセス
```

### イベント

```text
【浅草】○○開催！○月○日から○○で

概要

イベント情報
- 開催期間
- 場所
- 料金
- アクセス
```

## 9. サイト構成

```text
/
├── 浅草の最新情報
├── イベント
├── 祭り・季節行事
├── 公演・演芸
├── 新店舗
├── 閉店
├── セール
├── POP UP
├── 展示・アート
└── エリア
```

### 特集ページ

- 今日の浅草
- 今週の浅草
- 今週末の浅草イベント
- 浅草の新店舗
- 現在開催中のイベント
- 現在開催中のセール

## 10. DB

JSONデータを静的に利用。

```text
sources
source_documents
places
stores
events
news
categories
articles
entity_relations
```

## 11. 情報源の優先順位

1. 行政・公的機関
2. 寺社・施設・店舗の公式サイト
3. 公式プレスリリース
4. イベントプラットフォーム
5. 食べログ等
6. SNS
7. その他Webメディア

重要な開催日・営業時間・料金などは、可能な限り公式情報で確認する。
