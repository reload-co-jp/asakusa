import { FC } from "react"

// ASAKUSA JOURNAL ワードマーク。色はcurrentColor(墨)、朱は句点とルールのみ。
// textLengthで欧文幅を固定し、フォント未読込時も崩れないようにする
export const Logo: FC<{ sub: string; className?: string }> = ({
  sub,
  className,
}) => (
  <svg
    aria-label={`ASAKUSA JOURNAL ${sub}`}
    className={`logo${className ? ` ${className}` : ""}`}
    role="img"
    viewBox="0 0 280 56"
  >
    <text
      className="logo__en"
      lengthAdjust="spacingAndGlyphs"
      textLength="262"
      x="0"
      y="29"
    >
      ASAKUSA JOURNAL
    </text>
    <rect className="logo__accent" height="5.5" width="5.5" x="268" y="23.5" />
    <rect className="logo__accent" height="1.5" width="22" x="0" y="44.5" />
    <text className="logo__ja" x="30" y="50">
      {sub}
    </text>
  </svg>
)
