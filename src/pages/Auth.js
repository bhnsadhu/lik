import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Auth() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resentConfirm, setResentConfirm] = useState(false);

  const handleResend = async () => {
    setResending(true);
    await signIn(email.toLowerCase().trim());
    setResending(false);
    setResentConfirm(true);
  };

  useEffect(() => {
    if (!resentConfirm) return;
    const t = setTimeout(() => setResentConfirm(false), 2500);
    return () => clearTimeout(t);
  }, [resentConfirm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.toLowerCase().endsWith('@illinois.edu')) {
      setError('you need a uiuc email — try your @illinois.edu address');
      return;
    }

    setLoading(true);
    const { error: err } = await signIn(email.toLowerCase().trim());
    setLoading(false);

    if (err) {
      setError('something went wrong. try again?');
    } else {
      setSent(true);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-inner">
        <h1 className="wordmark">lik</h1>

        <p className="auth-tagline">
          find a place you lik.<br />
          with someone you lik.
        </p>

        {!sent ? (
          <form onSubmit={handleSubmit} className="auth-form">
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="yournetid@illinois.edu"
              autoComplete="email"
              autoFocus
              required
            />
            {error && <p className="error-text">{error}</p>}
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'sending...' : 'send magic link'}
            </button>
            <p className="auth-edu-note">
              🎓 uiuc students only — @illinois.edu required
            </p>
          </form>
        ) : (
          <div className="auth-sent">
            <div className="sent-icon">✉️</div>
            <p style={{ color: 'var(--text)', fontWeight: 500 }}>check your inbox</p>
            <p className="muted">
              we sent a magic link to <strong>{email}</strong>
            </p>
            <p className="muted" style={{ marginTop: 8 }}>
              click it and you're in — no password needed
            </p>
            <button
              onClick={handleResend}
              disabled={resending}
              style={{
                marginTop: 20,
                background: 'none',
                border: 'none',
                color: resentConfirm ? 'var(--accent)' : 'var(--muted)',
                fontSize: '0.875rem',
                cursor: resending ? 'default' : 'pointer',
                padding: 0,
                transition: 'color 0.2s',
              }}
            >
              {resending ? 'sending...' : resentConfirm ? 'sent again ✓' : "didn't get it? resend"}
            </button>
            <button
              onClick={() => { setSent(false); setEmail(''); setResentConfirm(false); }}
              style={{
                marginTop: 6,
                background: 'none',
                border: 'none',
                color: 'var(--muted)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                padding: 0,
                opacity: 0.7,
              }}
            >
              use a different email
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
