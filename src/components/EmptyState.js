// Every "there is nothing here" moment in the app renders through this, so a
// blank feed, a blank liks list and a failed load all read as one designed
// family instead of three different kinds of nothing.

const MARKS = {
  deck: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="7" y="3" width="13" height="17" rx="3" />
      <path d="M4 6.5v12A2.5 2.5 0 0 0 6.5 21H15" />
    </svg>
  ),
  spark: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3c.9 4.6 3.4 7.1 8 8-4.6.9-7.1 3.4-8 8-.9-4.6-3.4-7.1-8-8 4.6-.9 7.1-3.4 8-8z" />
    </svg>
  ),
  message: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 15a3 3 0 0 1-3 3H8l-4 3V6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3z" />
    </svg>
  ),
  offline: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a9 9 0 0 1 9 9 9 9 0 0 1-9 9 9 9 0 0 1-9-9 9 9 0 0 1 9-9z" />
      <path d="M12 8v5" />
      <path d="M12 16.2v.1" />
    </svg>
  ),
}

export default function EmptyState({ mark, title, message, tone = 'neutral', children }) {
  return (
    <div className="empty">
      {mark && (
        <span className={`empty-mark ${tone === 'alert' ? 'empty-mark--alert' : ''}`} aria-hidden="true">
          {MARKS[mark]}
        </span>
      )}
      <h2>{title}</h2>
      {message && <p>{message}</p>}
      {children}
    </div>
  )
}

// A load that genuinely failed. Never leave the user on a spinner: say what
// happened in plain words and give them the way out.
export function LoadError({
  title = "Can't reach lik right now",
  message = 'Check your connection and give it another go.',
  onRetry,
  retrying = false,
  secondaryLabel,
  onSecondary,
}) {
  return (
    <EmptyState mark="offline" tone="alert" title={title} message={message}>
      {onRetry && (
        <button
          className="btn btn-line"
          style={{ marginTop: 22, width: 'auto', padding: '13px 24px' }}
          onClick={onRetry}
          disabled={retrying}
        >
          {retrying ? 'Trying again...' : 'Try Again'}
        </button>
      )}
      {onSecondary && (
        <button className="btn-text" style={{ marginTop: 4 }} onClick={onSecondary}>
          {secondaryLabel}
        </button>
      )}
    </EmptyState>
  )
}
