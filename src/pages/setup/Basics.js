import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import StepDots from '../../components/StepDots'
import Wordmark from '../../components/Wordmark'
import AvatarCropper from '../../components/AvatarCropper'
import useSetupSave from './useSetupSave'
import { dataUrlToBlob } from '../../lib/avatar'
import { YEARS, GENDERS, BIO_PLACEHOLDERS, UIUC_MAJORS } from '../../lib/constants'

export default function Basics() {
  const { save, editing, profile, user } = useSetupSave('basics')
  const [name, setName] = useState(profile?.name || '')
  const [age, setAge] = useState(profile?.age || '')
  const [gender, setGender] = useState(profile?.gender || '')
  const [year, setYear] = useState(profile?.year || '')
  const [major, setMajor] = useState(profile?.major || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [avatar, setAvatar] = useState(profile?.profile_pic_url || null)
  const [cropping, setCropping] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [phIdx, setPhIdx] = useState(0)
  const [showMajors, setShowMajors] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setPhIdx((i) => (i + 1) % BIO_PLACEHOLDERS.length), 3200)
    return () => clearInterval(t)
  }, [])

  const majorMatches = major.trim()
    ? UIUC_MAJORS.filter((m) => m.includes(major.trim().toLowerCase())).slice(0, 6)
    : []

  const ready = name.trim() && age && gender && year && major.trim() && avatar

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
        major: major.trim(),
        bio: bio.trim(),
        profile_pic_url: picUrl,
      })
    } catch {
      setErr('could not save. try again.')
      setBusy(false)
    }
  }

  return (
    <div className="screen screen--bare">
      <Wordmark />
      {!editing && <StepDots current="basics" />}
      <h2 className="screen-title">the basics</h2>
      <p className="screen-sub">what future roommates see first.</p>

      <button className="avatar-row" onClick={() => setCropping(true)}>
        <span className="avatar-row__pic">
          {avatar ? <img src={avatar} alt="you" /> : '+'}
        </span>
        <span>
          <span style={{ display: 'block', fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>profile pic</span>
          <span style={{ fontSize: 14.5 }}>{avatar ? 'tap to change' : 'tap to set'}</span>
        </span>
      </button>

      <div className="field">
        <label className="field-label" htmlFor="name">first name</label>
        <input id="name" className="input" value={name} maxLength={30} onChange={(e) => setName(e.target.value)} placeholder="what people call you" />
      </div>

      <div className="input-row">
        <div className="field">
          <label className="field-label" htmlFor="age">age</label>
          <input id="age" className="input" type="number" inputMode="numeric" min={16} max={99} value={age} onChange={(e) => setAge(e.target.value)} placeholder="19" />
        </div>
        <div className="field" style={{ flex: 2, position: 'relative' }}>
          <label className="field-label" htmlFor="major">major</label>
          <input
            id="major"
            className="input"
            value={major}
            maxLength={60}
            autoComplete="off"
            onChange={(e) => { setMajor(e.target.value); setShowMajors(true) }}
            onFocus={() => setShowMajors(true)}
            onBlur={() => setTimeout(() => setShowMajors(false), 150)}
            placeholder="undeclared counts"
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
        </div>
      </div>

      <div className="field">
        <span className="field-label">you are</span>
        <div className="chip-wrap">
          {GENDERS.map((g) => (
            <button key={g} className={`chip ${gender === g ? 'on' : ''}`} onClick={() => setGender(g)}>
              {g}
            </button>
          ))}
        </div>
        <p style={{ color: 'var(--muted)', fontSize: 12.5, marginTop: 8 }}>
          you'll see roommates of the same gender. nonbinary folks see everyone.
        </p>
      </div>

      <div className="field">
        <span className="field-label">year</span>
        <div className="chip-wrap">
          {YEARS.map((y) => (
            <button key={y} className={`chip ${year === y ? 'on' : ''}`} onClick={() => setYear(y)}>
              {y}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="bio">bio</label>
        <textarea
          id="bio"
          className="textarea"
          value={bio}
          maxLength={240}
          onChange={(e) => setBio(e.target.value)}
          placeholder={BIO_PLACEHOLDERS[phIdx]}
        />
      </div>

      {err && <p className="err">{err}</p>}
      <div style={{ flex: 1 }} />
      <button className="btn btn-volt" disabled={busy || !ready} onClick={next}>
        {busy ? 'saving...' : editing ? 'save' : 'next'}
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
