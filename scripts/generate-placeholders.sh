#!/bin/bash
# プレースホルダー画像生成（開発用・本番写真差し替え前提）
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PLACES_DIR="$ROOT/public/images/places"
CATEGORIES_DIR="$ROOT/public/images/categories"
FONT="Hiragino Sans"

# --- Place type: id / 日本語ラベル / 背景色 ---
place_types=(
  "store:店舗:#c0392b"
  "facility:施設:#2980b9"
  "temple:寺院:#7a5230"
  "shrine:神社:#a83232"
  "museum:博物館:#8e44ad"
  "theater:劇場:#b8860b"
  "park:公園:#2e8b57"
  "tourist_spot:観光スポット:#e07b17"
  "other:その他:#6b6f76"
)

# --- Category: id / 日本語ラベル / 背景色 ---
categories=(
  "event:イベント:#b33"
  "festival:祭り・季節行事:#a83232"
  "performance:公演・演芸:#8e44ad"
  "new_opening:新規オープン:#27ae60"
  "closing:閉店:#6b6f76"
  "renewal:リニューアル:#2980b9"
  "sale:セール:#d64545"
  "campaign:キャンペーン:#e08e0b"
  "popup:POP UP:#16a085"
  "new_product:新商品:#2ecc71"
  "exhibition:展示会:#9b59b6"
  "facility_news:施設ニュース:#3172b3"
  "local_news:地域ニュース:#3a4a5c"
)

make_svg() {
  local out="$1" label="$2" color="$3"
  cat > "$out" << EOF
<svg width="400" height="300" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="300" fill="${color}"/>
  <circle cx="200" cy="118" r="46" fill="#ffffff" opacity="0.16"/>
  <path d="M200 84 C176 84 160 104 160 128 C160 152 200 190 200 190 C200 190 240 152 240 128 C240 104 224 84 200 84 Z" fill="#ffffff" opacity="0.9"/>
  <circle cx="200" cy="126" r="14" fill="${color}"/>
  <text x="200" y="240" font-size="26" fill="#ffffff" text-anchor="middle" font-family="${FONT}, sans-serif">${label}</text>
</svg>
EOF
}

mkdir -p "$PLACES_DIR" "$CATEGORIES_DIR"

for entry in "${place_types[@]}"; do
  IFS=":" read -r id label color <<< "$entry"
  svg="$PLACES_DIR/${id}.svg"
  make_svg "$svg" "$label" "$color"
  rsvg-convert -o "$PLACES_DIR/${id}.png" "$svg"
done

for entry in "${categories[@]}"; do
  IFS=":" read -r id label color <<< "$entry"
  svg="$CATEGORIES_DIR/${id}.svg"
  make_svg "$svg" "$label" "$color"
  rsvg-convert -o "$CATEGORIES_DIR/${id}.png" "$svg"
done

echo "generated: ${#place_types[@]} place images, ${#categories[@]} category images"
