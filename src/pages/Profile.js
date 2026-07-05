import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import BottomNav from '../components/BottomNav'
import Wordmark from '../components/Wordmark'
import { avatarUrl } from '../lib/avatar'
import { QUIZ, DB_BY_KEY } from '../lib/constants'

export default function Profile() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)
  const [photoIdx, setPhotoIdx] = useState(0)

  const link = `${window.location.origin}/?ref=${profile.referral_code}`
  const quizDone = Object.keys(profile.quiz || {}).length
  const limits = (profile.dealbreakers || []).map((k) => DB_BY_KEY[k]?.label).filter(Boolean)
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
        await navigator.share({ title: 'lik', text: 'find your uiuc roommate on lik', url: link })
        return
      } catch {
        /* fall through */
      }
    }
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const rows = [
    { label: 'photos', value: `${profile.photos?.length || 0} added`, to: '/setup/photos?edit=1' },
    { label: 'basics', value: `${profile.name} · ${profile.year} · ${profile.major}`, to: '/setup/basics?edit=1' },
    { label: 'housing', value: profile.housing_type, to: '/setup/housing?edit=1' },
    { label: 'living quiz', value: `${quizDone} of ${QUIZ.length} answered`, to: '/setup/quiz?edit=1' },
    { label: 'hard limits', value: limits.length ? limits.join(' · ') : 'none set', to: '/setup/limits?edit=1' },
    {
      label: 'logistics',
      value:
        profile.housing_type === 'dorm'
          ? `${profile.move_in || ''} · ${(profile.dorm_prefs || []).length} dorms`
          : `${profile.move_in || ''} · ${(profile.areas || []).length} areas`,
      to: '/setup/logistics?edit=1',
    },
  ]

  return (
    <div className="screen">
      <Wordmark />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 className="screen-title">this is you</h2>
        {avatarUrl(profile) && (
          <img
            src={avatarUrl(profile)}
            alt={profile.name}
            style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--line)', marginTop: 14 }}
          />
        )}
      </div>
      <p className="screen-sub">exactly how you show up in other feeds. tap anything to change it.</p>

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

      <p className="section-label">bring your people</p>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 12 }}>
        friends who join through your link get a friend badge in your feed, and you in theirs. your pool gets better when you grow it.
      </p>
      <button className="btn btn-ghost" onClick={copyInvite}>
        {copied ? 'link copied' : 'share your invite link'}
      </button>

      <button
        className="btn-text"
        style={{ marginTop: 26 }}
        onClick={async () => {
          await signOut()
          navigate('/')
        }}
      >
        sign out
      </button>

      <BottomNav />
    </div>
  )
}
