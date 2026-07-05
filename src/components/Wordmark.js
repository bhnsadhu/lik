// the lik wordmark: plain Bricolage Grotesque 800 in volt, exactly the same
// treatment as the app's display headings. nothing custom - the font's own i.
export default function Wordmark({ size = 28, style }) {
  return (
    <span className="wordmark" style={{ fontSize: size, ...style }}>
      lik
    </span>
  )
}
