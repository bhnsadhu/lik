import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import BottomNav from '../components/BottomNav'
import Wordmark from '../components/Wordmark'
import { avatarUrl } from '../lib/avatar'
import { SHARE_ORIGIN } from '../lib/site'
import { QUIZ, dbLabel, cap } from '../lib/constants'

export default function Profile() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)
  const [photoIdx, setPhotoIdx] = useState(0)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteErr, setDeleteErr] = useState('')
  const confirmRef = useRef(null)

  // the box opens at the very bottom of the page, where the fixed nav can
  // sit on top of it - a tap meant for delete would hit the nav instead
  useEffect(() => {
    if (confirmingDelete) confirmRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [confirmingDelete])

  async function deleteAccount() {
    setDeleting(true)
    setDeleteErr('')
    try {
      // photos first, while the session still exists: uploaded card photos
      // and cropped avatars all live under the user's own storage folder
      const { data: files } = await supabase.storage.from('photos').list(user.id, { limit: 100 })
      if (files?.length) {
        await supabase.storage.from('photos').remove(files.map((f) => `${user.id}/${f.name}`))
      }
      // deletes the auth user; profile, swipes, matches, messages, and
      // referrals all cascade from it
      const { error } = await supabase.rpc('delete_account')
      if (error) throw error
      // local scope: the server session is already gone with the user
      await supabase.auth.signOut({ scope: 'local' })
      navigate('/')
    } catch {
      setDeleteErr('Something went wrong. Nothing was deleted - try again')
      setDeleting(false)
    }
  }

  const link = `${SHARE_ORIGIN}/?ref=${profile.referral_code}`
  const quizDone = Object.keys(profile.quiz || {}).length
  const limits = (profile.dealbreakers || []).map((k) => dbLabel(k)).filter(Boolean)
  const photos = profile.photos || []

  function onPhotoTap(e) {
    if (photos.length < 2) return
    const rect = e.currentTarget.getBoundingClientRect()
    const frac = (e.clientX - rect.left) / rect.width
    if (frac < 0.33) setPhotoIdx((i) => Math.max(0, i - 1))
    else setPhotoIdx((i) => Math.min(photos.length - 1, i + 1))
  }

  async function copyInvite() {
    if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
      try {
        await navigator.share({ title: 'lik', text: 'Find your UIUC roommate on lik', url: link })
        return
      } catch {
        /* fall through */
      }
    }
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const placeCount =
    profile.housing_type === 'dorm' ? (profile.dorm_prefs || []).length : (profile.areas || []).length
  const placeWord = profile.housing_type === 'dorm' ? 'dorm' : 'area'

  const rows = [
    { label: 'Photos', value: `${profile.photos?.length || 0} added`, to: '/setup/photos?edit=1' },
    { label: 'Basics', value: [profile.name, profile.year, profile.major].filter(Boolean).join(' · '), to: '/setup/basics?edit=1' },
    { label: 'Housing', value: cap(profile.housing_type), to: '/setup/housing?edit=1' },
    { label: 'Living quiz', value: `${quizDone} of ${QUIZ.length} answered`, to: '/setup/quiz?edit=1' },
    { label: 'Hard limits', value: limits.length ? limits.join(' · ') : 'None set', to: '/setup/limits?edit=1' },
    {
      label: 'Preferences',
      // built by join so a missing move-in never leaves a dangling separator,
      // and one dorm never reads as "1 dorms"
      value:
        [profile.move_in, `${placeCount} ${placeWord}${placeCount === 1 ? '' : 's'}`]
          .filter(Boolean)
          .join(' · '),
      to: '/setup/logistics?edit=1',
    },
  ]

  return (
    <div className="screen">
      <Wordmark />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 className="screen-title">This is you</h2>
        {avatarUrl(profile) && (
          <img
            src={avatarUrl(profile)}
            alt={profile.name}
            style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--line)', marginTop: 14 }}
          />
        )}
      </div>
      <p className="screen-sub">Exactly how you show up in other feeds. Tap anything to change it.</p>

      <div className="profile-card" onClick={onPhotoTap}>
        {photos.length > 0 ? (
          <img className="person-card__photo" src={photos[photoIdx]} alt={profile.name} />
        ) : (
          <div className="person-card__photo" style={{ background: 'var(--ink-3)' }} />
        )}
        {photos.length > 1 && (
          <div className="person-card__bars">
            {photos.map((_, i) => (
              <div key={i} className={`person-card__bar ${i === photoIdx ? 'active' : ''}`} />
            ))}
          </div>
        )}
        <div className="person-card__fade" />
        <div className="person-card__body">
          <div className="person-card__name">
            {profile.name}, {profile.age}
          </div>
          <div className="person-card__meta">
            {profile.year} · {profile.major}
          </div>
          {profile.bio && (
            <p style={{ fontSize: 14, color: 'rgba(250,246,234,0.85)', marginBottom: 4 }}>{profile.bio}</p>
          )}
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        {rows.map((r) => (
          <button key={r.label} className="edit-row" onClick={() => navigate(r.to)}>
            <span className="edit-row__label">{r.label}</span>
            <span className="edit-row__value">{r.value}</span>
          </button>
        ))}
      </div>

      <p className="section-label">Bring your people</p>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 12 }}>
        Friends who join through your link get a friend badge in your feed, and you in theirs. Your pool gets better when you grow it.
      </p>
      <button className="btn btn-ghost" onClick={copyInvite}>
        {copied ? 'Link copied' : 'Share Your Invite Link'}
      </button>

      <button
        className="btn-text"
        style={{ marginTop: 26 }}
        onClick={async () => {
          await signOut()
          navigate('/')
        }}
      >
        Sign Out
      </button>
      <button className="btn-text" style={{ display: 'block', marginTop: 2 }} onClick={() => navigate('/privacy')}>
        Privacy Policy
      </button>

      {!confirmingDelete ? (
        <button
          className="btn-text"
          style={{ display: 'block', marginTop: 2, color: 'var(--coral)' }}
          onClick={() => setConfirmingDelete(true)}
        >
          Delete My Account
        </button>
      ) : (
        <div ref={confirmRef} style={{ marginTop: 14, padding: 16, border: '1px solid var(--coral)', borderRadius: 'var(--r-s)' }}>
          <p style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 6 }}>Delete your account for good?</p>
          <p style={{ color: 'var(--muted)', fontSize: 13.5, marginBottom: 14 }}>
            Your profile, photos, swipes, matches, and every message go with it. Immediately, permanently, no undo.
          </p>
          <button
            className="btn"
            style={{ background: 'var(--coral)', color: 'var(--ink)' }}
            disabled={deleting}
            onClick={deleteAccount}
          >
            {deleting ? 'Deleting...' : 'Yes, Delete Everything'}
          </button>
          <button
            className="btn-text"
            style={{ display: 'block', marginTop: 8 }}
            disabled={deleting}
            onClick={() => {
              setConfirmingDelete(false)
              setDeleteErr('')
            }}
          >
            Never Mind
          </button>
          {deleteErr && <p className="err">{deleteErr}</p>}
        </div>
      )}

      <BottomNav />
    </div>
  )
}
