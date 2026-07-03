import { useState } from 'react'
import StepDots from '../../components/StepDots'
import Wordmark from '../../components/Wordmark'
import useSetupSave from './useSetupSave'

export default function Housing() {
  const { save, editing, profile } = useSetupSave('housing')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function pick(type) {
    setBusy(true)
    setErr('')
    try {
      // switching pools resets pool-specific preferences
      const fields = { housing_type: type }
      if (profile?.housing_type && profile.housing_type !== type) {
        fields.dorm_prefs = []
        fields.areas = []
        fields.budget_min = null
        fields.budget_max = null
      }
      await save(fields)
    } catch {
      setErr('could not save. try again.')
      setBusy(false)
    }
  }

  return (
    <div className="screen screen--bare">
      <Wordmark />
      {!editing && <StepDots current="housing" />}
      <h2 className="screen-title">where are you living</h2>
      <p className="screen-sub">this decides who you see. dorm people see dorm people. apartment people see apartment people.</p>

      <button
        className="quiz-option"
        disabled={busy}
        onClick={() => pick('dorm')}
        style={{ padding: '26px 20px' }}
      >
        <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 22, display: 'block' }}>dorm</span>
        <span style={{ color: 'var(--muted)', fontSize: 14.5 }}>university housing · res halls · certified housing</span>
      </button>

      <button
        className="quiz-option"
        disabled={busy}
        onClick={() => pick('apartment')}
        style={{ padding: '26px 20px' }}
      >
        <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 22, display: 'block' }}>apartment</span>
        <span style={{ color: 'var(--muted)', fontSize: 14.5 }}>off campus · private lease · champaign or urbana</span>
      </button>

      {err && <p className="err">{err}</p>}
    </div>
  )
}
