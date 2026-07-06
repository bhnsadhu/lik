import { useState } from 'react'
import StepDots from '../../components/StepDots'
import Wordmark from '../../components/Wordmark'
import useSetupSave from './useSetupSave'
import { DEALBREAKERS, DB_BY_KEY } from '../../lib/constants'

export default function Limits() {
  const { save, editing, profile } = useSetupSave('limits')
  const [picked, setPicked] = useState(profile?.dealbreakers || [])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  function toggle(key) {
    setPicked((p) => {
      if (p.includes(key)) return p.filter((k) => k !== key)
      // picking a limit silently drops anything it contradicts
      const conflicts = DB_BY_KEY[key].conflicts
      return [...p.filter((k) => !conflicts.includes(k)), key]
    })
  }

  async function next() {
    setBusy(true)
    setErr('')
    try {
      await save({ dealbreakers: picked })
    } catch {
      setErr('could not save. try again')
      setBusy(false)
    }
  }

  return (
    <div className="screen screen--bare">
      <Wordmark />
      {!editing && <StepDots current="limits" />}
      <h2 className="screen-title">hard limits</h2>
      <p className="screen-sub">
        the stuff you will not budge on. these outweigh everything else in your matches. pick only what is real.
      </p>

      <div className="chip-wrap">
        {DEALBREAKERS.map((d) => (
          <button
            key={d.key}
            className={`chip ${picked.includes(d.key) ? 'on' : ''}`}
            aria-pressed={picked.includes(d.key)}
            onClick={() => toggle(d.key)}
          >
            {d.label}
          </button>
        ))}
      </div>

      {err && <p className="err">{err}</p>}
      <div style={{ flex: 1 }} />
      <button className="btn btn-volt" disabled={busy} onClick={next}>
        {busy ? 'saving...' : editing ? 'save' : picked.length ? 'next' : 'no hard limits · next'}
      </button>
    </div>
  )
}
