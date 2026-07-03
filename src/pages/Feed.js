import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { scoreProfiles, friendSignal } from '../lib/compatibility'
import { DB_BY_KEY } from '../lib/constants'
import BottomNav from '../components/BottomNav'
import Wordmark from '../components/Wordmark'

const FLY = 1.25

function Card({ person, fit, friend, top, onSwipe, onOpen }) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-260, 260], [-14, 14])
  const likOpacity = useTransform(x, [30, 130], [0, 1])
  const passOpacity = useTransform(x, [-130, -30], [1, 0])
  const flying = useRef(false)

  function release(_, info) {
    if (flying.current) return
    const power = info.offset.x + info.velocity.x * 0.25
    if (power > 140) fly(1)
    else if (power < -140) fly(-1)
    else animate(x, 0, { type: 'spring', stiffness: 320, damping: 26 })
  }

  function fly(dir) {
    if (flying.current) return
    flying.current = true
    animate(x, dir * window.innerWidth * FLY, { duration: 0.32, ease: 'easeIn' }).then(() =>
      onSwipe(dir > 0)
    )
  }

  // expose button-driven swipes on the top card
  useEffect(() => {
    if (!top) return
    person._fly = fly
    return () => {
      delete person._fly
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [top])

  return (
    <motion.div
      className="person-card"
      style={{ x, rotate, zIndex: top ? 2 : 1 }}
      drag={top ? 'x' : false}
      dragElastic={0.9}
      onDragEnd={release}
      initial={top ? false : { scale: 0.95, opacity: 0.7 }}
      animate={top ? { scale: 1, opacity: 1 } : { scale: 0.95, opacity: 0.7 }}
      onTap={(e, info) => {
        if (top && Math.abs(x.get()) < 8) onOpen()
      }}
    >
      {person.photos?.[0] ? (
        <img className="person-card__photo" src={person.photos[0]} alt={person.name} draggable={false} />
      ) : (
        <div className="person-card__photo" style={{ background: 'var(--ink-3)' }} />
      )}
      <div className="person-card__fade" />
      <motion.span className="stamp stamp--lik" style={{ opacity: likOpacity }}>lik</motion.span>
      <motion.span className="stamp stamp--pass" style={{ opacity: passOpacity }}>pass</motion.span>
      <div className="person-card__body">
        <div className="person-card__name">
          {person.name}, {person.age}
        </div>
        <div className="person-card__meta">
          {person.year} · {person.major}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="fit-badge">{fit.score}% fit</span>
          {friend && <span className="chip-tag chip-tag--volt">{friend}</span>}
          {(person.dealbreakers || []).slice(0, 2).map((k) =>
            DB_BY_KEY[k] ? (
              <span key={k} className="chip-tag">
                {DB_BY_KEY[k].label}
              </span>
            ) : null
          )}
        </div>
      </div>
    </motion.div>
  )
}

function DetailSheet({ person, fit, friend, onClose }) {
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
            <span className="chip-tag chip-tag--volt">{friend}</span>
          </>
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

function MatchTakeover({ me, them, matchId, onClose }) {
  const navigate = useNavigate()
  return (
    <motion.div className="takeover" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div
        initial={{ scale: 0.7, y: 24, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 16, delay: 0.08 }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        <div className="takeover-avatars">
          {me.photos?.[0] && <img src={me.photos[0]} alt="you" />}
          {them.photos?.[0] && <img src={them.photos[0]} alt={them.name} />}
        </div>
        <h1>
          it's a<br />lik.
        </h1>
        <p className="takeover-sub">
          you and {them.name} both said yes. go say something before it gets weird.
        </p>
        <button className="btn btn-ink" onClick={() => navigate(`/chat/${matchId}`)}>
          say hey to {them.name}
        </button>
        <button className="btn-text" style={{ color: 'rgba(19,16,7,0.7)', marginTop: 10 }} onClick={onClose}>
          keep swiping
        </button>
      </motion.div>
    </motion.div>
  )
}

function ReferralPrompt({ profile, onClose }) {
  const [copied, setCopied] = useState(false)
  const link = `${window.location.origin}/?ref=${profile.referral_code}`

  async function share() {
    if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
      try {
        await navigator.share({ title: 'lik', text: 'find your uiuc roommate on lik', url: link })
        return
      } catch {
        /* fall through to clipboard */
      }
    }
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

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
        <h2 style={{ fontSize: 26 }}>you're in.</h2>
        <p style={{ color: 'var(--muted)', fontSize: 15, margin: '8px 0 18px' }}>
          lik works better when your people are on it. friends you bring show up with a friend badge in feeds.
        </p>
        <button className="btn btn-volt" onClick={share}>
          {copied ? 'link copied' : 'invite a friend'}
        </button>
        <button className="btn-text" style={{ display: 'block', marginTop: 10 }} onClick={onClose}>
          maybe later
        </button>
      </motion.div>
    </>
  )
}

export default function Feed() {
  const { user, profile } = useAuth()
  const [queue, setQueue] = useState(null)
  const [idx, setIdx] = useState(0)
  const [detail, setDetail] = useState(false)
  const [match, setMatch] = useState(null)
  const [showReferral, setShowReferral] = useState(false)
  const busyRef = useRef(false)

  const load = useCallback(async () => {
    // claim a pending ?ref referral first so the friend badge is right on first paint
    const code = localStorage.getItem('lik-ref')
    if (code) {
      try {
        if (code !== profile.referral_code) {
          const { data: mine } = await supabase.from('referrals').select('id').eq('referred', user.id).maybeSingle()
          if (!mine) {
            const { data: referrer } = await supabase
              .from('profiles')
              .select('id')
              .eq('referral_code', code)
              .maybeSingle()
            if (referrer) await supabase.from('referrals').insert({ referrer: referrer.id, referred: user.id })
          }
        }
      } finally {
        localStorage.removeItem('lik-ref')
      }
    }

    const [{ data: swipes }, { data: refs }, { data: people }] = await Promise.all([
      supabase.from('swipes').select('target').eq('swiper', user.id),
      supabase.from('referrals').select('referrer, referred'),
      supabase
        .from('profiles')
        .select('*')
        .eq('housing_type', profile.housing_type)
        .eq('onboarding_step', 'done')
        .neq('id', user.id),
    ])
    const seen = new Set((swipes || []).map((s) => s.target))
    const allRefs = refs || []
    const scored = (people || [])
      .filter((p) => !seen.has(p.id))
      .map((p) => ({
        person: p,
        fit: scoreProfiles(profile, p),
        friend: friendSignal(user.id, p.id, allRefs),
      }))
      .sort((a, b) => (b.friend ? 12 : 0) + b.fit.score - ((a.friend ? 12 : 0) + a.fit.score))
    setQueue(scored)
    setIdx(0)
  }, [user.id, profile])

  useEffect(() => {
    load()
  }, [load])

  // one-time invite prompt right after onboarding
  useEffect(() => {
    if (localStorage.getItem('lik-show-referral')) {
      localStorage.removeItem('lik-show-referral')
      setShowReferral(true)
    }
  }, [])

  // live takeover if the other person completes the match while we're here
  useEffect(() => {
    const channel = supabase
      .channel('feed-matches')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'matches' }, async (payload) => {
        const m = payload.new
        if (m.user_a !== user.id && m.user_b !== user.id) return
        const otherId = m.user_a === user.id ? m.user_b : m.user_a
        const { data: other } = await supabase.from('profiles').select('*').eq('id', otherId).single()
        if (other) setMatch({ them: other, matchId: m.id })
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [user.id])

  const current = queue?.[idx]
  const next = queue?.[idx + 1]

  async function onSwipe(liked) {
    if (busyRef.current || !current) return
    busyRef.current = true
    const target = current.person
    setDetail(false)
    setIdx((i) => i + 1)
    const { error } = await supabase.from('swipes').insert({ swiper: user.id, target: target.id, liked })
    if (!error && liked) {
      const [a, b] = [user.id, target.id].sort()
      const { data: m } = await supabase
        .from('matches')
        .select('id')
        .eq('user_a', a)
        .eq('user_b', b)
        .maybeSingle()
      if (m) setMatch({ them: target, matchId: m.id })
    }
    busyRef.current = false
  }

  const empty = queue && idx >= queue.length

  return (
    <div className="screen">
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Wordmark />
        <span style={{ color: 'var(--muted)', fontSize: 13, fontWeight: 600 }}>
          {profile.housing_type === 'dorm' ? 'dorm pool' : 'apartment pool'}
        </span>
      </div>

      {!queue ? (
        <div className="empty"><div className="spin" /></div>
      ) : empty ? (
        <div className="empty">
          <h2>that's everyone. for now.</h2>
          <p>
            new people join every day, especially before move in. bring a friend and grow your own pool.
          </p>
          <button className="btn btn-line" style={{ marginTop: 22, width: 'auto', padding: '13px 24px' }} onClick={() => setShowReferral(true)}>
            invite a friend
          </button>
        </div>
      ) : (
        <>
          <div className="deck" style={{ marginTop: 14 }}>
            {next && (
              <Card
                key={next.person.id}
                person={next.person}
                fit={next.fit}
                friend={next.friend}
                top={false}
                onSwipe={() => {}}
                onOpen={() => {}}
              />
            )}
            {current && (
              <Card
                key={current.person.id}
                person={current.person}
                fit={current.fit}
                friend={current.friend}
                top
                onSwipe={onSwipe}
                onOpen={() => setDetail(true)}
              />
            )}
          </div>
          <div className="deck-actions">
            <button className="deck-btn deck-btn--pass" aria-label="pass" onClick={() => current?.person._fly?.(-1)}>
              pass
            </button>
            <button className="deck-btn deck-btn--lik" aria-label="lik" onClick={() => current?.person._fly?.(1)}>
              lik
            </button>
          </div>
        </>
      )}

      <AnimatePresence>
        {detail && current && (
          <DetailSheet
            person={current.person}
            fit={current.fit}
            friend={current.friend}
            onClose={() => setDetail(false)}
          />
        )}
        {showReferral && <ReferralPrompt profile={profile} onClose={() => setShowReferral(false)} />}
        {match && (
          <MatchTakeover me={profile} them={match.them} matchId={match.matchId} onClose={() => setMatch(null)} />
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  )
}
