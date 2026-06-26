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
  const [digits, setDigits] = useState(['', '', '', '', '', '', '', '']);
  const [verifyError, setVerifyError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const inputRefs = useRef([]);

  const handleResend = async () => {
    setResending(true);
    setDigits(['', '', '', '', '', '', '', '']);
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
      setError('illinois.edu email required');
      return;
    }

    setLoading(true);
    const { error: err } = await signIn(email.toLowerCase().trim());
    setLoading(false);

    if (err) {
      setError('something went wrong · try again');
    } else {
      setSent(true);
    }
  };

  const attemptVerify = async (ds) => {
    const code = ds.join('');
    if (code.length !== 8) return;
    setVerifyError('');
    setVerifying(true);
    const { error: err } = await verifyOtp(email.toLowerCase().trim(), code);
    setVerifying(false);
    if (err) {
      setVerifyError('invalid code. try again?');
      setDigits(['', '', '', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 0);
    }
    // on success: AuthContext onAuthStateChange handles the session + redirect
  };

  const handleDigitChange = async (i, val) => {
    // handle paste of full code
    if (val.length > 1) {
      const pasted = val.replace(/\D/g, '').slice(0, 8);
      const newDigits = Array.from({ length: 8 }, (_, j) => pasted[j] || '');
      setDigits(newDigits);
      if (pasted.length === 8) {
        await attemptVerify(newDigits);
      } else {
        inputRefs.current[Math.min(pasted.length, 7)]?.focus();
      }
      return;
    }

    const digit = val.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[i] = digit;
    setDigits(newDigits);

    if (digit && i < 7) {
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
    setDigits(['', '', '', '', '', '', '', '']);
    setVerifyError('');
    setResentConfirm(false);
  };

  return (
    <div className="auth-page">
      {!sent ? (
        <div className="auth-inner">
          <h1 className="wordmark">lik</h1>

          <p className="auth-tagline">
            find a place you lik. with someone you lik.
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="netid@illinois.edu"
              autoComplete="email"
              autoFocus
              required
            />
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'sending...' : 'send code'}
            </button>
            {error && <p className="auth-error">{error}</p>}
            <p className="auth-edu-note">
              uiuc students only · @illinois.edu required
            </p>
          </form>
        </div>
      ) : (
          <div className="otp-inner">
            <h2 className="otp-headline">check your inbox</h2>
            <p className="otp-sub">
              we sent a code to<br />
              <span className="otp-email">{email}</span>
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

            {verifying && <p className="otp-status">verifying...</p>}
            {verifyError && <p className="otp-status otp-status-error">{verifyError}</p>}

            <p className="otp-links">
              didn't get it?{' '}
              <span className="otp-link" onClick={handleResend}>{resentConfirm ? 'sent ✓' : 'resend'}</span>
              <span className="otp-sep">·</span>
              <span className="otp-link" onClick={resetToEmail}>change email</span>
            </p>
          </div>
        )}
    </div>
  );
}
