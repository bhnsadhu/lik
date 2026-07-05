// the lik wordmark: lowercase volt with a square standing in for the i's dot,
// its top flush with the tops of l and k. the i's stem is drawn as a box so it
// can start below the font's x-height, giving the tittle real breathing room;
// the dotless ı glyph stays in the markup only to reserve correct spacing.
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
