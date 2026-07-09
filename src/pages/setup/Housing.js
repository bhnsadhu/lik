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
      const switched = profile?.housing_type && profile.housing_type !== type
      if (switched) {
        fields.dorm_prefs = []
        fields.areas = []
        fields.budget_min = null
        fields.budget_max = null
      }
      // a pool switch while editing wiped those picks - go straight to
      // preferences to make new ones instead of back to the profile
      await save(fields, switched ? { after: '/setup/logistics?edit=1' } : undefined)
    } catch {
      setErr('Could not save. Try again')
      setBusy(false)
    }
  }

  return (
    <div className="screen screen--bare">
      <Wordmark />
      {!editing && <StepDots current="housing" />}
      <h2 className="screen-title">Where are you living?</h2>
      <p className="screen-sub">This decides who you see. Dorm people see dorm people. Apartment people see apartment people.</p>

      <button
        className="quiz-option"
        disabled={busy}
        onClick={() => pick('dorm')}
        style={{ padding: '26px 20px' }}
      >
        <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 22, display: 'block' }}>Dorm</span>
        <span style={{ color: 'var(--muted)', fontSize: 14.5 }}>University housing · Res halls · Certified housing</span>
      </button>

      <button
        className="quiz-option"
        disabled={busy}
        onClick={() => pick('apartment')}
        style={{ padding: '26px 20px' }}
      >
        <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 22, display: 'block' }}>Apartment</span>
        <span style={{ color: 'var(--muted)', fontSize: 14.5 }}>Off campus · Private lease · Champaign or Urbana</span>
      </button>

      {editing && profile?.housing_type && (
        <p style={{ color: 'var(--muted)', fontSize: 12.5, marginTop: 4 }}>
          Switching resets your dorm, area, and budget picks.
        </p>
      )}

      {err && <p className="err">{err}</p>}
    </div>
  )
}
