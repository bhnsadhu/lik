import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { STEPS, firstIncompleteStep } from '../lib/onboarding'

const LABELS = {
  housing: 'housing',
  basics: 'profile',
  photos: 'photos',
  quiz: 'quiz',
  logistics: 'prefs',
  limits: 'limits',
}

export default function StepDots({ current }) {
  const { profile } = useAuth()
  const navigate = useNavigate()

  const pointerStep = profile?.onboarding_step === 'done' ? null : firstIncompleteStep(profile) || current
  const pointerIdx = pointerStep ? STEPS.indexOf(pointerStep) : STEPS.length

  function onTap(step, idx) {
    if (idx <= pointerIdx) {
      navigate(`/setup/${step}`)
    } else if (pointerStep) {
      // locked: send them back to the step they actually need to finish first
      navigate(`/setup/${pointerStep}`)
    }
  }

  return (
    <div className="step-tabs">
      {STEPS.map((s, i) => {
        const state = i < pointerIdx ? 'done' : i === pointerIdx ? 'current' : 'locked'
        return (
          <button
            key={s}
            type="button"
            className={`step-tab ${state} ${s === current ? 'active' : ''}`}
            onClick={() => onTap(s, i)}
          >
            <span className="step-tab__bar" />
            <span className="step-tab__label">{LABELS[s]}</span>
          </button>
        )
      })}
    </div>
  )
}
