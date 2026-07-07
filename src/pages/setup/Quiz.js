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
  // refs are the source of truth: the exiting AnimatePresence card keeps a
  // stale closure alive, and taps on it must not wipe answers or advance twice
  const answersRef = useRef(profile?.quiz || {})
  const idxRef = useRef(0)

  const q = QUIZ[Math.min(idx, QUIZ.length - 1)]

  async function pick(choice, key) {
    if (busy) return
    if (key !== QUIZ[idxRef.current].key) return
    const next = { ...answersRef.current, [key]: choice }
    answersRef.current = next
    setAnswers(next)
    setErr('')
    if (idxRef.current < QUIZ.length - 1) {
      idxRef.current += 1
      const target = idxRef.current
      setTimeout(() => setIdx(target), 180)
      return
    }
    // last card: every question must have an answer before anything saves.
    // unreachable through normal taps, but back-nav or a dropped state
    // update should land you on the missed question, not a broken save
    const missed = QUIZ.findIndex((item) => !next[item.key])
    if (missed !== -1) {
      idxRef.current = missed
      setIdx(missed)
      setErr('This one still needs an answer')
      return
    }
    setBusy(true)
    try {
      await save({ quiz: next })
    } catch {
      setErr('Could not save. Try again')
      setBusy(false)
    }
  }

  function goBack() {
    if (idxRef.current === 0) return
    idxRef.current -= 1
    setIdx(idxRef.current)
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
            <button className={`quiz-option ${answers[q.key] === 'a' ? 'on' : ''}`} aria-pressed={answers[q.key] === 'a'} disabled={busy} onClick={() => pick('a', q.key)}>
              {q.a}
            </button>
            <button className={`quiz-option ${answers[q.key] === 'b' ? 'on' : ''}`} aria-pressed={answers[q.key] === 'b'} disabled={busy} onClick={() => pick('b', q.key)}>
              {q.b}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {err && <p className="err">{err}</p>}
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button className="btn-text" style={{ visibility: idx > 0 ? 'visible' : 'hidden' }} onClick={goBack}>
          Back
        </button>
        {busy && <div className="spin" />}
      </div>
    </div>
  )
}
