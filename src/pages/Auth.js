import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Auth() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // TODO: re-enable .edu validation before launch
    // if (!email.toLowerCase().endsWith('@illinois.edu')) {
    //   setError('you need a uiuc email — try your @illinois.edu address');
    //   return;
    // }

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
          </div>
        )}
      </div>
    </div>
  );
}
