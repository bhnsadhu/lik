// The lik wordmark. Three letters, Archivo Black, ink. Nothing else, ever.
export default function Wordmark({ size = 18, color = 'var(--ink)', style }) {
  return (
    <span
      style={{
        fontFamily: "'Archivo Black', sans-serif",
        fontSize: typeof size === 'number' ? `${size}px` : size,
        color,
        letterSpacing: '-0.03em',
        lineHeight: 1,
        display: 'inline-block',
        userSelect: 'none',
        ...style,
      }}
    >
      lik
    </span>
  );
}
