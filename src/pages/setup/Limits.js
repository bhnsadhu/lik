import { useState } from 'react'
import StepDots from '../../components/StepDots'
import Wordmark from '../../components/Wordmark'
import useSetupSave from './useSetupSave'
import { DEALBREAKERS, DB_BY_KEY, CUSTOM_DB_PREFIX, dbLabel } from '../../lib/constants'

const MAX_CUSTOM = 5

export default function Limits() {
  const { save, editing, profile } = useSetupSave('limits')
  const [picked, setPicked] = useState(profile?.dealbreakers || [])
  const [draft, setDraft] = useState('')
  const [customErr, setCustomErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const customs = picked.filter((k) => k.startsWith(CUSTOM_DB_PREFIX))

  function toggle(key) {
    setPicked((p) => {
      if (p.includes(key)) return p.filter((k) => k !== key)
      // picking a limit silently drops anything it contradicts
      const conflicts = DB_BY_KEY[key].conflicts
      return [...p.filter((k) => !conflicts.includes(k)), key]
    })
  }

  function addCustom() {
    const text = draft.trim().replace(/\s+/g, ' ')
    if (!text) return
    // if it's really one of the presets, select the preset instead
    const preset = DEALBREAKERS.find((d) => d.label.toLowerCase() === text.toLowerCase())
    if (preset) {
      if (!picked.includes(preset.key)) toggle(preset.key)
      setDraft('')
      setCustomErr('')
      return
    }
    const key = CUSTOM_DB_PREFIX + text
    if (picked.some((k) => k.toLowerCase() === key.toLowerCase())) {
      setCustomErr('You already have that one')
      return
    }
    if (customs.length >= MAX_CUSTOM) {
      setCustomErr(`${MAX_CUSTOM} of your own is the cap · Make them count`)
      return
    }
    setPicked((p) => [...p, key])
    setDraft('')
    setCustomErr('')
  }

  function removeCustom(key) {
    setPicked((p) => p.filter((k) => k !== key))
    setCustomErr('')
  }

  async function next() {
    setBusy(true)
    setErr('')
    try {
      await save({ dealbreakers: picked })
    } catch {
      setErr('Could not save. Try again')
      setBusy(false)
    }
  }

  return (
    <div className="screen screen--bare">
      <Wordmark />
      {!editing && <StepDots current="limits" />}
      <h2 className="screen-title">Hard limits</h2>
      <p className="screen-sub">
        The stuff you will not budge on. These outweigh everything else in your matches. Pick only what is real.
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
        {customs.map((k) => (
          <button
            key={k}
            className="chip on"
            aria-label={`Remove ${dbLabel(k)}`}
            onClick={() => removeCustom(k)}
          >
            {dbLabel(k)} <span aria-hidden="true">×</span>
          </button>
        ))}
      </div>

      <div className="field" style={{ marginTop: 18 }}>
        <label className="field-label" htmlFor="custom-limit">Write Your Own</label>
        <div className="input-row">
          <input
            id="custom-limit"
            className={`input ${customErr ? 'is-err' : ''}`}
            value={draft}
            maxLength={40}
            placeholder="No shellfish in the kitchen"
            onChange={(e) => {
              setDraft(e.target.value)
              if (customErr) setCustomErr('')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addCustom()
              }
            }}
          />
          <button
            className="btn btn-ghost"
            style={{ flex: '0 0 auto', width: 'auto', padding: '0 22px' }}
            disabled={!draft.trim()}
            onClick={addCustom}
          >
            Add
          </button>
        </div>
        {customErr && <p className="field-err">{customErr}</p>}
        <p style={{ color: 'var(--muted)', fontSize: 12.5, marginTop: 8 }}>
          Allergies, medical needs, anything the list missed. Tap one to remove it.
        </p>
      </div>

      {err && <p className="err">{err}</p>}
      <div style={{ flex: 1 }} />
      <button className="btn btn-volt" disabled={busy} onClick={next}>
        {busy ? 'Saving...' : editing ? 'Save' : picked.length ? 'Next' : 'No Hard Limits · Next'}
      </button>
    </div>
  )
}
