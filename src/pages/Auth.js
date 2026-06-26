import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Auth() {
  const { signIn, verifyOtp } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resentConfirm, setResentConfirm] = useState(false);
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [verifyError, setVerifyError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const inputRefs = useRef([]);

  const handleResend = async () => {
    setResending(true);
    setDigits(['', '', '', '', '', '']);
    setVerifyError('');
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

  const attemptVerify = async (ds) => {
    const code = ds.join('');
    if (code.length !== 6) return;
    setVerifyError('');
    setVerifying(true);
    const { error: err } = await verifyOtp(email.toLowerCase().trim(), code);
    setVerifying(false);
    if (err) {
      setVerifyError('invalid code. try again?');
      setDigits(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 0);
    }
    // on success: AuthContext onAuthStateChange handles the session + redirect
  };

  const handleDigitChange = async (i, val) => {
    // handle paste of full code
    if (val.length > 1) {
      const pasted = val.replace(/\D/g, '').slice(0, 6);
      const newDigits = Array.from({ length: 6 }, (_, j) => pasted[j] || '');
      setDigits(newDigits);
      if (pasted.length === 6) {
        await attemptVerify(newDigits);
      } else {
        inputRefs.current[Math.min(pasted.length, 5)]?.focus();
      }
      return;
    }

    const digit = val.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[i] = digit;
    setDigits(newDigits);

    if (digit && i < 5) {
      inputRefs.current[i + 1]?.focus();
    }

    if (newDigits.every(d => d !== '')) {
      await attemptVerify(newDigits);
    }
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  };

  const resetToEmail = () => {
    setSent(false);
    setEmail('');
    setDigits(['', '', '', '', '', '']);
    setVerifyError('');
    setResentConfirm(false);
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
              {loading ? 'sending...' : 'send code'}
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
              we sent a code to <strong>{email}</strong>
            </p>

            <div className="otp-row">
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el; }}
                  className="otp-box"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={d}
                  onChange={e => handleDigitChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  onFocus={e => e.target.select()}
                  autoFocus={i === 0}
                  disabled={verifying}
                />
              ))}
            </div>

            {verifying && <p className="muted" style={{ marginTop: 4 }}>verifying...</p>}
            {verifyError && <p className="error-text" style={{ marginTop: 4 }}>{verifyError}</p>}

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
              onClick={resetToEmail}
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
