import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import StepDots from '../../components/StepDots'
import Wordmark from '../../components/Wordmark'
import AvatarCropper from '../../components/AvatarCropper'
import useSetupSave from './useSetupSave'
import { dataUrlToBlob } from '../../lib/avatar'
import { YEARS, GENDERS, BIO_PLACEHOLDERS, UIUC_MAJORS, cap, canonOne } from '../../lib/constants'

function ageError(value) {
  const s = String(value).trim()
  if (!s) return "Age can't be empty"
  if (!/^\d+$/.test(s)) return 'Age needs to be a number'
  if (s.length === 1) return 'Age needs two digits'
  if (s.length > 2) return "Age can't be more than two digits"
  if (Number(s) < 16) return 'Age must be 16 or older'
  return null
}

export default function Basics() {
  const { save, editing, profile, user } = useSetupSave('basics')
  const [name, setName] = useState(profile?.name || '')
  const [age, setAge] = useState(profile?.age || '')
  const [gender, setGender] = useState(profile?.gender || '')
  const [year, setYear] = useState(canonOne(YEARS, profile?.year) || '')
  const [major, setMajor] = useState(canonOne(UIUC_MAJORS, profile?.major) || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [avatar, setAvatar] = useState(profile?.profile_pic_url || null)
  const [cropping, setCropping] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [phIdx, setPhIdx] = useState(0)
  const [showMajors, setShowMajors] = useState(false)
  const [touched, setTouched] = useState({})
  const [attempted, setAttempted] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setPhIdx((i) => (i + 1) % BIO_PLACEHOLDERS.length), 3200)
    return () => clearInterval(t)
  }, [])

  const majorMatches = major.trim()
    ? UIUC_MAJORS.filter((m) => m.toLowerCase().includes(major.trim().toLowerCase())).slice(0, 6)
    : []

  // major must be a real list entry, not free text; store the canonical form
  const canonicalMajor = UIUC_MAJORS.find((m) => m.toLowerCase() === major.trim().toLowerCase()) || null

  const errors = {
    avatar: !avatar ? 'Add a profile pic' : null,
    name: !name.trim() ? "Full name can't be empty" : null,
    age: ageError(age),
    major: !major.trim() ? "Major can't be empty" : !canonicalMajor ? 'Pick your major from the list' : null,
    gender: !gender ? 'Pick whichever fits' : null,
    year: !year ? 'Pick your year' : null,
    bio: !bio.trim() ? "Bio can't be empty" : null,
  }
  const ready = Object.values(errors).every((e) => !e)
  const show = (k) => (touched[k] || attempted ? errors[k] : null)
  const touch = (k) => setTouched((t) => ({ ...t, [k]: true }))

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
      let picUrl = avatar
      // freshly cropped pics are data urls; upload once, store the public url
      if (avatar?.startsWith('data:')) {
        const path = `${user.id}/avatar_${Date.now()}.jpg`
        const { error } = await supabase.storage.from('photos').upload(path, dataUrlToBlob(avatar), {
          cacheControl: '31536000',
          contentType: 'image/jpeg',
          upsert: false,
        })
        if (error) throw error
        picUrl = supabase.storage.from('photos').getPublicUrl(path).data.publicUrl
      }
      await save({
        name: name.trim(),
        age: Number(age),
        gender,
        year,
        major: canonicalMajor,
        bio: bio.trim(),
        profile_pic_url: picUrl,
      })
    } catch {
      setErr('Could not save. Try again')
      setBusy(false)
    }
  }

  return (
    <div className="screen screen--bare">
      <Wordmark />
      {!editing && <StepDots current="basics" />}
      <h2 className="screen-title">The basics</h2>
      <p className="screen-sub">What future roommates see first.</p>

      <div className="field" style={{ marginBottom: 0 }}>
        <button className="avatar-row" onClick={() => setCropping(true)}>
          <span className="avatar-row__pic">
            {avatar ? <img src={avatar} alt="You" /> : '+'}
          </span>
          <span>
            <span style={{ display: 'block', fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>Profile pic</span>
            <span style={{ fontSize: 14.5 }}>{avatar ? 'Tap to change' : 'Tap to set'}</span>
          </span>
        </button>
        {show('avatar') && <p className="field-err" style={{ marginTop: -8, marginBottom: 16 }}>{errors.avatar}</p>}
      </div>

      <div className="field">
        <label className="field-label" htmlFor="name">Full Name</label>
        <input
          id="name"
          className={`input ${show('name') ? 'is-err' : ''}`}
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => touch('name')}
          placeholder="First and last name"
        />
        {show('name') && <p className="field-err">{errors.name}</p>}
      </div>

      <div className="input-row" style={{ alignItems: 'flex-start' }}>
        <div className="field">
          <label className="field-label" htmlFor="age">Age</label>
          <input
            id="age"
            className={`input ${show('age') ? 'is-err' : ''}`}
            type="number"
            inputMode="numeric"
            min={16}
            max={99}
            value={age}
            onChange={(e) => setAge(e.target.value)}
            onBlur={() => touch('age')}
            placeholder="19"
          />
          {show('age') && <p className="field-err">{errors.age}</p>}
        </div>
        <div className="field" style={{ flex: 2, position: 'relative' }}>
          <label className="field-label" htmlFor="major">Major</label>
          <input
            id="major"
            className={`input ${show('major') ? 'is-err' : ''}`}
            value={major}
            maxLength={60}
            autoComplete="off"
            onChange={(e) => { setMajor(e.target.value); setShowMajors(true) }}
            onFocus={() => setShowMajors(true)}
            onBlur={() => { setTimeout(() => setShowMajors(false), 150); touch('major') }}
            placeholder="Start typing"
          />
          {showMajors && majorMatches.length > 0 && (
            <div className="major-dropdown">
              {majorMatches.map((m) => (
                <div
                  key={m}
                  className="major-dropdown__item"
                  onMouseDown={() => { setMajor(m); setShowMajors(false) }}
                >
                  {m}
                </div>
              ))}
            </div>
          )}
          {show('major') && <p className="field-err">{errors.major}</p>}
        </div>
      </div>

      <div className="field">
        <span className="field-label">You Are</span>
        <div className="chip-wrap">
          {GENDERS.map((g) => (
            <button key={g} className={`chip ${gender === g ? 'on' : ''}`} aria-pressed={gender === g} onClick={() => setGender(g)}>
              {cap(g)}
            </button>
          ))}
        </div>
        {show('gender') && <p className="field-err">{errors.gender}</p>}
        <p style={{ color: 'var(--muted)', fontSize: 12.5, marginTop: 8 }}>
          You'll see roommates of the same gender. Nonbinary folks see everyone.
        </p>
      </div>

      <div className="field">
        <span className="field-label">Year</span>
        <div className="chip-wrap">
          {YEARS.map((y) => (
            <button key={y} className={`chip ${year === y ? 'on' : ''}`} aria-pressed={year === y} onClick={() => setYear(y)}>
              {y}
            </button>
          ))}
        </div>
        {show('year') && <p className="field-err">{errors.year}</p>}
      </div>

      <div className="field">
        <label className="field-label" htmlFor="bio">Bio · You as a roommate, in a line or two</label>
        <textarea
          id="bio"
          className={`textarea ${show('bio') ? 'is-err' : ''}`}
          value={bio}
          maxLength={240}
          onChange={(e) => setBio(e.target.value)}
          onBlur={() => touch('bio')}
          placeholder={BIO_PLACEHOLDERS[phIdx]}
        />
        {show('bio') && <p className="field-err">{errors.bio}</p>}
      </div>

      {err && <p className="err">{err}</p>}
      <div style={{ flex: 1 }} />
      <button
        className={`btn btn-volt ${!ready ? 'btn--locked' : ''}`}
        aria-disabled={!ready || busy}
        disabled={busy}
        onClick={onNextTap}
      >
        {busy ? 'Saving...' : editing ? 'Save' : 'Next'}
      </button>

      {cropping && (
        <AvatarCropper
          onDone={(dataUrl) => {
            setAvatar(dataUrl)
            setCropping(false)
          }}
          onClose={() => setCropping(false)}
        />
      )}
    </div>
  )
}
