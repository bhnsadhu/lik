// the lik wordmark: lowercase volt with a squared-off tittle on the i, its
// top flush with the tops of l and k and exactly as wide as the stem.
// uses dotless i so the tittle owns the space.
export default function Wordmark({ size = 28, style }) {
  return (
    <span className="wordmark" style={{ fontSize: size, ...style }}>
      l
      <span className="wordmark-i">
        {'ı'}
        <span className="wordmark-dot" aria-hidden="true" />
      </span>
      k
    </span>
  )
}
