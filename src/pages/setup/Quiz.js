import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import StepDots from '../../components/StepDots'
import Wordmark from '../../components/Wordmark'
import useSetupSave from './useSetupSave'
import { QUIZ } from '../../lib/constants'

export default function Quiz() {
  const { save, editing, profile } = useSetupSave('quiz')
  const [answers, setAnswers] = useState(profile?.quiz || {})
  const [idx, setIdx] = useState(0)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const transRef = useRef(false)

  const q = QUIZ[Math.min(idx, QUIZ.length - 1)]
  const last = idx >= QUIZ.length - 1

  async function pick(choice) {
    // ignore taps during the card transition, else a fast tap lands on the
    // exiting question and advances twice
    if (busy || transRef.current) return
    const next = { ...answers, [q.key]: choice }
    setAnswers(next)
    if (!last) {
      transRef.current = true
      setTimeout(() => {
        setIdx((i) => Math.min(i + 1, QUIZ.length - 1))
        transRef.current = false
      }, 180)
      return
    }
    setBusy(true)
    setErr('')
    try {
      await save({ quiz: next })
    } catch {
      setErr('could not save. try again.')
      setBusy(false)
    }
  }

  return (
    <div className="screen screen--bare">
      <Wordmark />
      {!editing && <StepDots current="quiz" />}
      <p className="quiz-count" style={{ marginTop: 18 }}>
        {idx + 1} / {QUIZ.length}
      </p>

      <AnimatePresence mode="wait">
        <motion.div
          key={q.key}
          initial={{ opacity: 0, x: 32 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -32 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        >
          <h2 className="screen-title" style={{ minHeight: 76 }}>{q.q}</h2>
          <div style={{ marginTop: 18 }}>
            <button className={`quiz-option ${answers[q.key] === 'a' ? 'on' : ''}`} disabled={busy} onClick={() => pick('a')}>
              {q.a}
            </button>
            <button className={`quiz-option ${answers[q.key] === 'b' ? 'on' : ''}`} disabled={busy} onClick={() => pick('b')}>
              {q.b}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {err && <p className="err">{err}</p>}
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button className="btn-text" style={{ visibility: idx > 0 ? 'visible' : 'hidden' }} onClick={() => setIdx((i) => i - 1)}>
          back
        </button>
        {busy && <div className="spin" />}
      </div>
    </div>
  )
}
