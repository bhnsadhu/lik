import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StepDots from '../../components/StepDots'
import Wordmark from '../../components/Wordmark'
import useSetupSave from './useSetupSave'
import { MOVE_IN, DORMS, AREAS } from '../../lib/constants'

// null when fine, otherwise which rule the value breaks
function budgetIssue(value) {
  const s = String(value).trim()
  if (!s) return 'empty'
  if (!/^\d+$/.test(s)) return 'whole'
  if (Number(s) < 1) return 'zero'
  return null
}

export default function Logistics() {
  const { save, editing, profile } = useSetupSave('logistics')
  const navigate = useNavigate()
  const isDorm = profile?.housing_type === 'dorm'

  // preferences depends entirely on housing type (dorm fields vs apartment
  // fields) - if it's somehow missing, this page can't render meaningfully
  useEffect(() => {
    if (profile && !profile.housing_type) navigate('/setup/housing', { replace: true })
  }, [profile, navigate])
  const [moveIn, setMoveIn] = useState(profile?.move_in || '')
  const [dorms, setDorms] = useState(profile?.dorm_prefs || [])
  const [areas, setAreas] = useState(profile?.areas || [])
  const [budgetMin, setBudgetMin] = useState(profile?.budget_min || '')
  const [budgetMax, setBudgetMax] = useState(profile?.budget_max || '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [touched, setTouched] = useState({})
  const [attempted, setAttempted] = useState(false)

  // "no preference" / "anywhere works" are mutually exclusive with every real
  // option: picking one clears the rest, picking a real option clears it.
  function toggleExclusive(list, setList, val, noneVal) {
    if (val === noneVal) {
      setList(list.includes(noneVal) ? [] : [noneVal])
      return
    }
    const without = list.filter((x) => x !== noneVal)
    setList(without.includes(val) ? without.filter((x) => x !== val) : [...without, val])
  }

  const minIssue = budgetIssue(budgetMin)
  const maxIssue = budgetIssue(budgetMax)
  const minVisible = touched.min || attempted
  const maxVisible = touched.max || attempted

  // one line under the budget row: the most pressing thing, specifically
  let budgetErr = ''
  if (minVisible && maxVisible && minIssue === 'empty' && maxIssue === 'empty') {
    budgetErr = 'add your min and max budget'
  } else if (minVisible && minIssue) {
    budgetErr =
      minIssue === 'empty' ? 'add a min budget'
        : minIssue === 'whole' ? 'min budget needs to be a whole number'
          : 'min budget needs to be more than 0'
  } else if (maxVisible && maxIssue) {
    budgetErr =
      maxIssue === 'empty' ? 'add a max budget'
        : maxIssue === 'whole' ? 'max budget needs to be a whole number'
          : 'max budget needs to be more than 0'
  } else if (!minIssue && !maxIssue) {
    // both filled and numeric: range problems show live, no touch needed
    if (Number(budgetMin) > Number(budgetMax)) budgetErr = "min budget can't be higher than max"
    else if (Number(budgetMin) === Number(budgetMax)) budgetErr = 'min budget needs to be less than max'
  }

  const rangeBad = !minIssue && !maxIssue && Number(budgetMin) >= Number(budgetMax)
  const minErrOn = (minVisible && minIssue) || rangeBad
  const maxErrOn = (maxVisible && maxIssue) || rangeBad

  const budgetValid = !minIssue && !maxIssue && Number(budgetMin) < Number(budgetMax)
  const moveInErr = !moveIn ? "pick when you're moving in" : ''
  const dormsErr = isDorm && dorms.length === 0 ? 'pick at least one dorm' : ''
  const areasErr = !isDorm && areas.length === 0 ? 'pick at least one area' : ''

  const ready = !moveInErr && (isDorm ? !dormsErr : !areasErr && budgetValid)

  function onNextTap() {
    if (!ready) {
      setAttempted(true)
      setTimeout(() => document.querySelector('.field-err')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80)
      return
    }
    next()
  }

  async function next() {
    setBusy(true)
    setErr('')
    try {
      await save(
        isDorm
          ? { move_in: moveIn, dorm_prefs: dorms }
          : {
              move_in: moveIn,
              areas,
              budget_min: Number(budgetMin),
              budget_max: Number(budgetMax),
            }
      )
    } catch {
      setErr('could not save. try again')
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
            <button key={m} className={`chip ${moveIn === m ? 'on' : ''}`} aria-pressed={moveIn === m} onClick={() => setMoveIn(m)}>
              {m}
            </button>
          ))}
        </div>
        {attempted && moveInErr && <p className="field-err">{moveInErr}</p>}
      </div>

      {isDorm ? (
        <div className="field">
          <span className="field-label">dorms you are considering</span>
          <div className="chip-wrap">
            {[...DORMS, 'no preference'].map((d) => (
              <button
                key={d}
                className={`chip ${dorms.includes(d) ? 'on' : ''}`}
                aria-pressed={dorms.includes(d)}
                onClick={() => toggleExclusive(dorms, setDorms, d, 'no preference')}
              >
                {d}
              </button>
            ))}
          </div>
          {attempted && dormsErr && <p className="field-err">{dormsErr}</p>}
        </div>
      ) : (
        <>
          <div className="field">
            <span className="field-label">monthly budget (usd)</span>
            <div className="input-row">
              <input
                className={`input ${minErrOn ? 'is-err' : ''}`}
                type="number"
                inputMode="numeric"
                placeholder="min · 500"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, min: true }))}
                aria-label="min budget"
              />
              <input
                className={`input ${maxErrOn ? 'is-err' : ''}`}
                type="number"
                inputMode="numeric"
                placeholder="max · 900"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, max: true }))}
                aria-label="max budget"
              />
            </div>
            {budgetErr && <p className="field-err">{budgetErr}</p>}
          </div>
          <div className="field">
            <span className="field-label">areas you are considering</span>
            <div className="chip-wrap">
              {[...AREAS, 'anywhere works'].map((a) => (
                <button
                  key={a}
                  className={`chip ${areas.includes(a) ? 'on' : ''}`}
                  aria-pressed={areas.includes(a)}
                  onClick={() => toggleExclusive(areas, setAreas, a, 'anywhere works')}
                >
                  {a}
                </button>
              ))}
            </div>
            {attempted && areasErr && <p className="field-err">{areasErr}</p>}
          </div>
        </>
      )}

      {err && <p className="err">{err}</p>}
      <div style={{ flex: 1, minHeight: 20 }} />
      <button
        className={`btn btn-volt ${!ready ? 'btn--locked' : ''}`}
        aria-disabled={!ready || busy}
        disabled={busy}
        onClick={onNextTap}
      >
        {busy ? 'saving...' : editing ? 'save' : 'done · show me people'}
      </button>
    </div>
  )
}
