import { useState } from 'react'
import StepDots from '../../components/StepDots'
import Wordmark from '../../components/Wordmark'
import useSetupSave from './useSetupSave'
import { MOVE_IN, DORMS, AREAS } from '../../lib/constants'

export default function Logistics() {
  const { save, editing, profile } = useSetupSave('logistics')
  const isDorm = profile?.housing_type === 'dorm'
  const [moveIn, setMoveIn] = useState(profile?.move_in || '')
  const [dorms, setDorms] = useState(profile?.dorm_prefs || [])
  const [areas, setAreas] = useState(profile?.areas || [])
  const [budgetMin, setBudgetMin] = useState(profile?.budget_min || '')
  const [budgetMax, setBudgetMax] = useState(profile?.budget_max || '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  function toggleIn(list, setList, val) {
    setList(list.includes(val) ? list.filter((v) => v !== val) : [...list, val])
  }

  const ready = moveIn && (isDorm ? dorms.length > 0 : areas.length > 0 && budgetMax)

  async function next() {
    if (!isDorm && budgetMin && Number(budgetMin) > Number(budgetMax)) {
      setErr('budget min is above budget max.')
      return
    }
    setBusy(true)
    setErr('')
    try {
      await save(
        isDorm
          ? { move_in: moveIn, dorm_prefs: dorms }
          : {
              move_in: moveIn,
              areas,
              budget_min: budgetMin ? Number(budgetMin) : null,
              budget_max: Number(budgetMax),
            }
      )
    } catch {
      setErr('could not save. try again.')
      setBusy(false)
    }
  }

  return (
    <div className="screen screen--bare">
      <Wordmark />
      {!editing && <StepDots current="logistics" />}
      <h2 className="screen-title">the practical stuff</h2>
      <p className="screen-sub">{isDorm ? 'when and where on campus.' : 'budget, timing, and where in town.'}</p>

      <div className="field">
        <span className="field-label">moving in</span>
        <div className="chip-wrap">
          {MOVE_IN.map((m) => (
            <button key={m} className={`chip ${moveIn === m ? 'on' : ''}`} onClick={() => setMoveIn(m)}>
              {m}
            </button>
          ))}
        </div>
      </div>

      {isDorm ? (
        <div className="field">
          <span className="field-label">dorms you are considering</span>
          <div className="chip-wrap">
            {DORMS.map((d) => (
              <button key={d} className={`chip ${dorms.includes(d) ? 'on' : ''}`} onClick={() => toggleIn(dorms, setDorms, d)}>
                {d}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="field">
            <span className="field-label">monthly budget (usd)</span>
            <div className="input-row">
              <input
                className="input"
                type="number"
                inputMode="numeric"
                placeholder="min · 500"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
              />
              <input
                className="input"
                type="number"
                inputMode="numeric"
                placeholder="max · 900"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
              />
            </div>
          </div>
          <div className="field">
            <span className="field-label">areas you are considering</span>
            <div className="chip-wrap">
              {AREAS.map((a) => (
                <button key={a} className={`chip ${areas.includes(a) ? 'on' : ''}`} onClick={() => toggleIn(areas, setAreas, a)}>
                  {a}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {err && <p className="err">{err}</p>}
      <div style={{ flex: 1, minHeight: 20 }} />
      <button className="btn btn-volt" disabled={busy || !ready} onClick={next}>
        {busy ? 'saving...' : editing ? 'save' : 'done · show me people'}
      </button>
    </div>
  )
}
