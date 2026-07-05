// the lik wordmark: geometric letters cut from a 12-unit stroke. the i's dot
// is a square, one stroke wide, its top flush with the tops of l and k so all
// three letters share the same cap line. bottom edge of the viewBox is the
// baseline, so the svg sits on the text baseline when used inline.
export default function Wordmark({ size = 28, style }) {
  return (
    <svg
      className="wordmark"
      viewBox="0 0 74 64"
      style={{ height: size, ...style }}
      role="img"
      aria-label="lik"
    >
      <rect x="0" y="0" width="12" height="64" />
      <rect x="22" y="0" width="12" height="12" />
      <rect x="22" y="24" width="12" height="40" />
      <rect x="44" y="0" width="12" height="64" />
      <polygon points="56,42 74,24 74,38 56,56" />
      <polygon points="56,46 74,64 60,64 56,60" />
    </svg>
  )
}
