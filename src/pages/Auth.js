import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { WHITELIST } from '../lib/constants'
import Wordmark from '../components/Wordmark'

const CODE_LEN = 8

function validEmail(email) {
  const e = email.trim().toLowerCase()
  if (WHITELIST.includes(e)) return e
  if (/^[^@\s]+@illinois\.edu$/.test(e)) return e
  return null
}

export default function Auth() {
  const [stage, setStage] = useState('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState(Array(CODE_LEN).fill(''))
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [resendState, setResendState] = useState('idle') // 'idle' | 'sent'
  const boxRefs = useRef([])
  const resendTimerRef = useRef(null)

  useEffect(() => () => clearTimeout(resendTimerRef.current), [])

  async function sendCode(e) {
    e.preventDefault()
    setErr('')
    const clean = validEmail(email)
    if (!clean) {
      setErr('lik is for uiuc students. use your illinois.edu email')
      return
    }
    setBusy(true)
    const { error } = await supabase.auth.signInWithOtp({
      email: clean,
      options: { shouldCreateUser: true, emailRedirectTo: undefined },
    })
    setBusy(false)
    if (error) {
      setErr(error.message.toLowerCase().replace(/\.$/, ''))
      return
    }
    setStage('code')
    setTimeout(() => boxRefs.current[0]?.focus(), 50)
  }

  async function resendCode() {
    clearTimeout(resendTimerRef.current)
    setResendState('sent')
    resendTimerRef.current = setTimeout(() => setResendState('idle'), 2000)
    setErr('')
    setCode(Array(CODE_LEN).fill(''))
    boxRefs.current[0]?.focus()
    const { error } = await supabase.auth.signInWithOtp({
      email: validEmail(email),
      options: { shouldCreateUser: true, emailRedirectTo: undefined },
    })
    if (error) setErr(error.message.toLowerCase().replace(/\.$/, ''))
  }

  async function verify(fullCode) {
    setErr('')
    setBusy(true)
    const { error } = await supabase.auth.verifyOtp({
      email: validEmail(email),
      token: fullCode,
      type: 'email',
    })
    setBusy(false)
    if (error) {
      setErr('that code did not work. check it and try again')
      setCode(Array(CODE_LEN).fill(''))
      boxRefs.current[0]?.focus()
    }
    // success: onAuthStateChange routes us
  }

  function onBox(i, val) {
    const digits = val.replace(/\D/g, '')
    if (!digits) {
      const next = [...code]
      next[i] = ''
      setCode(next)
      return
    }
    const next = [...code]
    // support pasting the whole code into one box
    for (let j = 0; j < digits.length && i + j < CODE_LEN; j++) {
      next[i + j] = digits[j]
    }
    setCode(next)
    const filled = next.findIndex((c) => !c)
    if (filled === -1) {
      verify(next.join(''))
    } else {
      boxRefs.current[Math.min(i + digits.length, CODE_LEN - 1)]?.focus()
    }
  }

  function onKey(i, e) {
    if (e.key === 'Backspace' && !code[i] && i > 0) {
      boxRefs.current[i - 1]?.focus()
    }
  }

  return (
    <div className="screen screen--bare" style={{ justifyContent: 'center', position: 'relative' }}>
      <div className="glow-field">
        <div className="glow glow--neon" />
        <div className="glow glow--sky" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        style={{ position: 'relative' }}
      >
        <h1 style={{ lineHeight: 1 }}>
          <Wordmark size="clamp(88px, 30vw, 140px)" style={{ display: 'block' }} />
        </h1>
        <p className="overline" style={{ color: 'var(--muted)', margin: '14px 0 10px' }}>
          a friend who happens to split rent
        </p>
        <p style={{ fontSize: 19, fontWeight: 500, margin: '0 0 36px', color: 'var(--paper)' }}>
          find a place you lik.<br />with someone you lik.
        </p>

        {stage === 'email' && (
          <form onSubmit={sendCode}>
            <div className="field">
              <label className="field-label" htmlFor="email">illinois email</label>
              <input
                id="email"
                className="input"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="netid@illinois.edu"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  // the moment the address becomes valid, the complaint goes
                  if (err && validEmail(e.target.value)) setErr('')
                }}
                autoFocus
              />
            </div>
            {err && <p className="err">{err}</p>}
            <button className="btn btn-volt" type="submit" disabled={busy || !email.trim()} style={{ marginTop: 8 }}>
              {busy ? 'sending...' : 'send my code'}
            </button>
            <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', marginTop: 18 }}>
              illinois students only. no exceptions.
            </p>
          </form>
        )}

        {stage === 'code' && (
          <div>
            <h2 style={{ fontSize: 24, marginBottom: 8 }}>check your inbox</h2>
            <p style={{ color: 'var(--muted)', fontSize: 14.5, marginBottom: 16 }}>
              we sent an {CODE_LEN} digit code to {email.trim().toLowerCase()}
            </p>
            <div className="otp-row">
              {code.map((c, i) => (
                <input
                  key={i}
                  ref={(el) => (boxRefs.current[i] = el)}
                  className="otp-box"
                  inputMode="numeric"
                  autoComplete={i === 0 ? 'one-time-code' : 'off'}
                  value={c}
                  onChange={(e) => onBox(i, e.target.value)}
                  onKeyDown={(e) => onKey(i, e)}
                />
              ))}
            </div>
            {err && <p className="err" style={{ textAlign: 'center' }}>{err}</p>}
            {busy && <div className="spin" style={{ marginTop: 18 }} />}
            <button
              type="button"
              className={`btn-text resend-btn ${resendState === 'sent' ? 'is-sent' : ''}`}
              style={{ display: 'flex', marginTop: 16 }}
              onClick={resendCode}
            >
              <AnimatePresence mode="wait" initial={false}>
                {resendState === 'sent' ? (
                  <motion.span
                    key="sent"
                    className="resend-btn__label"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 12l6 6L20 6" />
                    </svg>
                    sent
                  </motion.span>
                ) : (
                  <motion.span
                    key="idle"
                    className="resend-btn__label"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                  >
                    resend code
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            <button
              className="btn-text"
              style={{ display: 'block', marginTop: 4 }}
              onClick={() => {
                setStage('email')
                setCode(Array(CODE_LEN).fill(''))
                setErr('')
                setResendState('idle')
                clearTimeout(resendTimerRef.current)
              }}
            >
              wrong email? go back
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}
