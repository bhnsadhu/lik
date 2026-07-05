// the lik wordmark: lowercase volt with a square standing in for the i's dot,
// its top flush with the tops of l and k. uses dotless i so the square owns
// the space.
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
