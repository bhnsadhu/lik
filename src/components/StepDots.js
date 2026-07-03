const STEPS = ['photos', 'basics', 'housing', 'quiz', 'limits', 'logistics']

export default function StepDots({ current }) {
  const idx = STEPS.indexOf(current)
  return (
    <div className="step-dots">
      {STEPS.map((s, i) => (
        <span key={s} className={i <= idx ? 'done' : ''} />
      ))}
    </div>
  )
}

export { STEPS }
