import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { supabase, withTimeout } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { scoreProfiles, friendSignal, gendersCompatible } from '../lib/compatibility'
import { avatarUrl } from '../lib/avatar'
import { SHARE_ORIGIN } from '../lib/site'
import { dbLabel, REVIEWER_EMAIL, SHOW_DEMO_PROFILES_TO_EVERYONE } from '../lib/constants'
import BottomNav from '../components/BottomNav'
import Wordmark from '../components/Wordmark'
import PersonSheet from '../components/PersonSheet'
import EmptyState, { LoadError } from '../components/EmptyState'

const FLY = 1.25

function Card({ person, fit, friend, top, onSwipe, onOpen, registerFly }) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-260, 260], [-14, 14])
  const likOpacity = useTransform(x, [30, 130], [0, 1])
  const passOpacity = useTransform(x, [-130, -30], [1, 0])
  const flying = useRef(false)
  const flyRef = useRef(null)
  const [photoIdx, setPhotoIdx] = useState(0)
  const photos = person.photos || []

  function onPhotoTap(e) {
    if (photos.length < 2) return
    const rect = e.currentTarget.getBoundingClientRect()
    const frac = (e.clientX - rect.left) / rect.width
    if (frac < 0.33) setPhotoIdx((i) => Math.max(0, i - 1))
    else setPhotoIdx((i) => Math.min(photos.length - 1, i + 1))
  }

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
  flyRef.current = fly

  // let the pass/lik buttons drive the top card
  useEffect(() => {
    if (!top || !registerFly) return
    registerFly((dir) => flyRef.current?.(dir))
    return () => registerFly(null)
  }, [top, registerFly])

  return (
    <motion.div
      className="person-card"
      style={{ x, rotate, zIndex: top ? 2 : 1 }}
      drag={top ? 'x' : false}
      dragElastic={0.9}
      onDragEnd={release}
      initial={top ? false : { scale: 0.95, opacity: 0.7 }}
      animate={top ? { scale: 1, opacity: 1 } : { scale: 0.95, opacity: 0.7 }}
      onTap={(e) => {
        if (top && Math.abs(x.get()) < 8) onPhotoTap(e)
      }}
    >
      {photos.length > 0 ? (
        <img className="person-card__photo" src={photos[photoIdx]} alt={person.name} draggable={false} />
      ) : (
        <div className="person-card__photo" style={{ background: 'var(--ink-3)' }} />
      )}
      {top && photos.length > 1 && (
        <div className="person-card__bars">
          {photos.map((_, i) => (
            <div key={i} className={`person-card__bar ${i === photoIdx ? 'active' : ''}`} />
          ))}
        </div>
      )}
      <div className="person-card__fade" />
      <motion.span className="stamp stamp--lik" style={{ opacity: likOpacity }}>lik</motion.span>
      <motion.span className="stamp stamp--pass" style={{ opacity: passOpacity }}>pass</motion.span>
      {top && (
        <button
          className="person-card__info"
          aria-label="More info"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            onOpen()
          }}
        >
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <circle cx="9" cy="9" r="7.3" />
            <line x1="9" y1="8.2" x2="9" y2="12.6" />
            <circle cx="9" cy="5.6" r="0.9" fill="currentColor" stroke="none" />
          </svg>
        </button>
      )}
      <div className="person-card__body">
        <div className="person-card__name">
          {person.name}, {person.age}
        </div>
        <div className="person-card__meta">
          {person.year} · {person.major}
        </div>
        {photoIdx === 0
          ? person.bio && <p className="person-card__bio">{person.bio}</p>
          : person.photo_caption && <p className="person-card__bio person-card__bio--caption">"{person.photo_caption}"</p>}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="fit-badge">{fit.score}% fit</span>
          {friend && <span className="chip-tag chip-tag--sky">{friend}</span>}
          {(person.dealbreakers || [])
            .map((k) => dbLabel(k))
            .filter(Boolean)
            .slice(0, 2)
            .map((label) => (
              <span key={label} className="chip-tag">
                {label}
              </span>
            ))}
        </div>
      </div>
    </motion.div>
  )
}


const TICKER_HALF = `${Array(10).fill("It's a lik").join(' · ')} · `

function MatchTakeover({ me, them, matchId, onClose }) {
  const navigate = useNavigate()
  return (
    <motion.div className="takeover" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="ticker ticker--top" aria-hidden="true">
        <div className="ticker__track">{TICKER_HALF + TICKER_HALF}</div>
      </div>
      <div className="ticker ticker--bottom" aria-hidden="true">
        <div className="ticker__track">{TICKER_HALF + TICKER_HALF}</div>
      </div>
      <motion.div
        initial={{ scale: 0.7, y: 24, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 16, delay: 0.08 }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        <div className="takeover-avatars">
          {avatarUrl(me) && <img src={avatarUrl(me)} alt="You" />}
          {avatarUrl(them) && <img src={avatarUrl(them)} alt={them.name} />}
        </div>
        <p className="overline">Claim approved</p>
        <motion.h1
          initial={{ scale: 1.35, rotate: -4, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 17, delay: 0.16 }}
        >
          It's a<br />lik.
        </motion.h1>
        <p className="takeover-sub">
          You and {them.name} both said yes. Go say something before it gets weird.
        </p>
        <button className="btn btn-ink" onClick={() => navigate(`/chat/${matchId}`)}>
          Say hey to {them.name}
        </button>
        <button className="btn-text" style={{ color: 'rgba(16,13,28,0.7)', marginTop: 10 }} onClick={onClose}>
          Keep Swiping
        </button>
      </motion.div>
    </motion.div>
  )
}

function ReferralPrompt({ profile, onClose }) {
  const [copied, setCopied] = useState(false)
  const link = `${SHARE_ORIGIN}/?ref=${profile.referral_code}`

  async function share() {
    if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
      try {
        await navigator.share({ title: 'lik', text: 'Find your UIUC roommate on lik', url: link })
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
        <h2 style={{ fontSize: 26 }}>You're covered.</h2>
        <p style={{ color: 'var(--muted)', fontSize: 15, margin: '8px 0 18px' }}>
          Your pool gets better with more people in it. Friends who join through your link get a friend badge in your feed, and you in theirs.
        </p>
        <button className="btn btn-volt" onClick={share}>
          {copied ? 'Link copied' : 'Invite a Friend'}
        </button>
        <button className="btn-text" style={{ display: 'block', marginTop: 10 }} onClick={onClose}>
          Maybe Later
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
  const [loadError, setLoadError] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [swipeErr, setSwipeErr] = useState('')
  const busyRef = useRef(false)
  const topFlyRef = useRef(null)
  const registerFly = useCallback((fn) => {
    topFlyRef.current = fn
  }, [])

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

    const [swipeRes, refRes, peopleRes] = await Promise.all([
      withTimeout(supabase.from('swipes').select('target').eq('swiper', user.id)),
      withTimeout(supabase.from('referrals').select('referrer, referred')),
      withTimeout(
        supabase
          .from('profiles')
          .select('*')
          .eq('housing_type', profile.housing_type)
          .eq('onboarding_step', 'done')
          .neq('id', user.id)
      ),
    ])

    // a failed load must never render as "that's everyone" - an empty feed and
    // an unreachable backend look identical to the user otherwise
    if (swipeRes.error || refRes.error || peopleRes.error) {
      setLoadError(true)
      setQueue(null)
      return
    }
    setLoadError(false)

    const { data: swipes } = swipeRes
    const { data: refs } = refRes
    const { data: people } = peopleRes
    const seen = new Set((swipes || []).map((s) => s.target))
    const allRefs = refs || []
    // demo profiles exist so App Review can complete the loop solo. They are
    // currently open to everyone for testing - see SHOW_DEMO_PROFILES_TO_EVERYONE,
    // which must go back to false before public launch.
    const canSeeDemos = SHOW_DEMO_PROFILES_TO_EVERYONE || user.email === REVIEWER_EMAIL
    const scored = (people || [])
      .filter((p) => !seen.has(p.id))
      .filter((p) => (canSeeDemos ? true : !p.is_demo))
      .filter((p) => gendersCompatible(profile.gender, p.gender))
      .map((p) => ({
        person: p,
        fit: scoreProfiles(profile, p),
        friend: friendSignal(user.id, p.id, allRefs),
      }))
      .sort((a, b) => (b.friend ? 12 : 0) + b.fit.score - ((a.friend ? 12 : 0) + a.fit.score))
    setQueue(scored)
    setIdx(0)
  }, [user.id, user.email, profile])

  useEffect(() => {
    load()
  }, [load])

  async function retryLoad() {
    setRetrying(true)
    await load()
    setRetrying(false)
  }

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
    setSwipeErr('')
    setIdx((i) => i + 1)
    const { error } = await withTimeout(
      supabase.from('swipes').insert({ swiper: user.id, target: target.id, liked })
    )
    if (error) {
      // the swipe never landed: put the card back rather than quietly losing
      // the person off the end of the deck
      setIdx((i) => Math.max(0, i - 1))
      setSwipeErr("That didn't save. Check your connection and try again")
      busyRef.current = false
      return
    }
    if (liked) {
      const [a, b] = [user.id, target.id].sort()
      const { data: m } = await withTimeout(
        supabase.from('matches').select('id').eq('user_a', a).eq('user_b', b).maybeSingle()
      )
      if (m) setMatch({ them: target, matchId: m.id })
    }
    busyRef.current = false
  }

  const empty = queue && idx >= queue.length

  return (
    <div className="screen">
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Wordmark />
        <span className="chip-tag chip-tag--outline" style={{ color: 'var(--muted)' }}>
          {profile.housing_type === 'dorm' ? 'Dorm pool' : 'Apartment pool'}
        </span>
      </div>

      {loadError ? (
        <LoadError
          message="Your feed is still here. Check your connection and give it another go."
          onRetry={retryLoad}
          retrying={retrying}
        />
      ) : !queue ? (
        <div className="empty"><div className="spin" /></div>
      ) : empty ? (
        <EmptyState
          mark="deck"
          title="That's everyone. For now."
          message="New people join every day, especially before move-in. Bring a friend and grow your own pool."
        >
          <button className="btn btn-line" style={{ marginTop: 22, width: 'auto', padding: '13px 24px' }} onClick={() => setShowReferral(true)}>
            Invite a Friend
          </button>
        </EmptyState>
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
                registerFly={registerFly}
              />
            )}
          </div>
          <div className="deck-actions">
            <button className="deck-btn deck-btn--pass" aria-label="Pass" onClick={() => topFlyRef.current?.(-1)}>
              Pass
            </button>
            <button className="deck-btn deck-btn--lik" aria-label="lik" onClick={() => topFlyRef.current?.(1)}>
              lik
            </button>
          </div>
          {swipeErr && <p className="err" style={{ textAlign: 'center', marginTop: 0 }}>{swipeErr}</p>}
        </>
      )}

      <AnimatePresence>
        {detail && current && (
          <PersonSheet
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
