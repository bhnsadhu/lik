import { motion } from 'framer-motion'
import { DB_BY_KEY } from '../lib/constants'

// Full profile bottom sheet: photos, bio, shared traits, conflicts, hard
// limits, logistics. Used by the feed's card detail and the chat header.
export default function PersonSheet({ person, fit, friend, onClose }) {
  return (
    <>
      <motion.div className="sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        className="sheet"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 32 }}
      >
        <div className="sheet-handle" />
        <h2 style={{ fontSize: 28 }}>
          {person.name}, {person.age}
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: 14.5, marginTop: 2 }}>
          {person.year} · {person.major}
        </p>

        {person.bio && <p style={{ marginTop: 14, fontSize: 15.5, lineHeight: 1.55 }}>{person.bio}</p>}

        <p className="section-label">what you share · {fit.score}% fit</p>
        {fit.sharedLimits.length + fit.shared.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 14.5 }}>not much overlap yet. opposites survive too.</p>
        ) : (
          <div className="chip-wrap">
            {fit.sharedLimits.map((s) => (
              <span key={s} className="chip-tag chip-tag--volt">{s}</span>
            ))}
            {fit.shared.map((s) => (
              <span key={s} className="chip-tag">{s}</span>
            ))}
          </div>
        )}

        {fit.conflicts.length > 0 && (
          <>
            <p className="section-label" style={{ color: 'var(--coral)' }}>heads up</p>
            {fit.conflicts.map((c, i) => (
              <p key={i} style={{ color: 'var(--coral)', fontSize: 14.5, marginBottom: 6 }}>
                you need {c.mine} · they said {c.theirs}
              </p>
            ))}
          </>
        )}

        {(person.dealbreakers || []).length > 0 && (
          <>
            <p className="section-label">their hard limits</p>
            <div className="chip-wrap">
              {person.dealbreakers.map((k) =>
                DB_BY_KEY[k] ? <span key={k} className="chip-tag chip-tag--outline">{DB_BY_KEY[k].label}</span> : null
              )}
            </div>
          </>
        )}

        <p className="section-label">logistics</p>
        <div className="chip-wrap">
          {person.move_in && <span className="chip-tag chip-tag--outline">{person.move_in}</span>}
          {person.housing_type === 'apartment' && person.budget_max && (
            <span className="chip-tag chip-tag--outline">
              {person.budget_min ? `$${person.budget_min} to $${person.budget_max}` : `up to $${person.budget_max}`} / mo
            </span>
          )}
          {(person.housing_type === 'dorm' ? person.dorm_prefs : person.areas)?.slice(0, 6).map((v) => (
            <span key={v} className="chip-tag chip-tag--outline">{v}</span>
          ))}
        </div>

        {friend && (
          <>
            <p className="section-label">connection</p>
            <span className="chip-tag chip-tag--sky">{friend}</span>
          </>
        )}

        {person.photo_caption && person.photos?.length > 1 && (
          <p className="section-label" style={{ marginBottom: 6 }}>their photos · "{person.photo_caption}"</p>
        )}
        {person.photos?.slice(1).map((url) => (
          <img
            key={url}
            src={url}
            alt={person.name}
            style={{ width: '100%', borderRadius: 16, marginTop: 14 }}
          />
        ))}
        <div style={{ height: 8 }} />
      </motion.div>
    </>
  )
}
