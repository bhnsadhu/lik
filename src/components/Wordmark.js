// the lik wordmark: lowercase volt with a square standing in for the i's dot,
// its top flush with the tops of l and k and exactly as wide as the stem. the
// stem is drawn as a box that starts below the font's x-height so the square
// gets real breathing room; the dotless ı glyph stays only to reserve spacing.
export default function Wordmark({ size = 28, style }) {
  return (
    <span className="wordmark" style={{ fontSize: size, ...style }}>
      l
      <span className="wordmark-i">
        <span className="wordmark-glyph">{'ı'}</span>
        <span className="wordmark-dot" aria-hidden="true" />
        <span className="wordmark-stem" aria-hidden="true" />
      </span>
      k
    </span>
  )
}
