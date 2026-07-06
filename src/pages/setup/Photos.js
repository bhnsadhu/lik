import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import StepDots from '../../components/StepDots'
import Wordmark from '../../components/Wordmark'
import useSetupSave from './useSetupSave'
import { MIN_PHOTOS } from '../../lib/constants'

const SLOTS = 6

const CAPTION_PLACEHOLDERS = [
  'these are my people',
  'campus life, mostly',
  'green street at 1am',
  'me and whoever was around',
  'proof i go outside',
]

export default function Photos() {
  const { save, editing, profile, user } = useSetupSave('photos')
  const [photos, setPhotos] = useState(profile?.photos || [])
  const [caption, setCaption] = useState(profile?.photo_caption || '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [phIdx, setPhIdx] = useState(0)
  const [attempted, setAttempted] = useState(false)
  const [captionTouched, setCaptionTouched] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    const t = setInterval(() => setPhIdx((i) => (i + 1) % CAPTION_PLACEHOLDERS.length), 3200)
    return () => clearInterval(t)
  }, [])

  const needed = Math.max(0, MIN_PHOTOS - photos.length)
  const captionMissing = !caption.trim()
  const ready = needed === 0 && !captionMissing
  const captionErr = (captionTouched || attempted) && captionMissing ? "caption can't be empty" : ''

  const status = busy
    ? 'uploading...'
    : needed > 0 && captionMissing
      ? `${needed} more photo${needed > 1 ? 's' : ''} and a caption to go`
      : needed > 0
        ? `${needed} more photo${needed > 1 ? 's' : ''} to go`
        : captionMissing
          ? 'photos look good. just add a caption below'
          : 'all set'

  async function onFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > 8 * 1024 * 1024) {
      setErr('that photo is over 8mb. pick a smaller one')
      return
    }
    setErr('')
    setBusy(true)
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${user.id}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('photos').upload(path, file, {
      cacheControl: '31536000',
      upsert: false,
    })
    if (error) {
      setBusy(false)
      setErr('upload failed. try again')
      return
    }
    const { data } = supabase.storage.from('photos').getPublicUrl(path)
    setPhotos((p) => [...p, data.publicUrl])
    setBusy(false)
  }

  async function next() {
    if (!ready) {
      setAttempted(true)
      return
    }
    setBusy(true)
    try {
      await save({ photos, photo_caption: caption.trim() })
    } catch {
      setErr('could not save. try again')
      setBusy(false)
    }
  }

  return (
    <div className="screen screen--bare">
      <Wordmark />
      {!editing && <StepDots current="photos" />}
      <h2 className="screen-title">show your face</h2>
      <p className="screen-sub">first photo is your card. make it count. add at least five.</p>

      <div className="photo-grid">
        {Array.from({ length: SLOTS }).map((_, i) => {
          const url = photos[i]
          return url ? (
            <div key={url} className={`photo-cell filled ${i === 0 ? 'primary' : ''}`}>
              <img src={url} alt={`you ${i + 1}`} />
              <button
                className="remove"
                aria-label="remove photo"
                onClick={() => setPhotos((p) => p.filter((u) => u !== url))}
              >
                x
              </button>
            </div>
          ) : (
            <button
              key={`empty-${i}`}
              className="photo-cell"
              aria-label="add photo"
              onClick={() => fileRef.current?.click()}
              disabled={busy || i !== photos.length}
            >
              +
            </button>
          )
        })}
      </div>
      <p className={`photo-status ${ready && !busy ? 'ok' : ''}`} role="status">{status}</p>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />

      <div className="field" style={{ marginTop: 16 }}>
        <label className="field-label" htmlFor="caption">caption your photo set</label>
        <input
          id="caption"
          className={`input ${captionErr ? 'is-err' : ''}`}
          value={caption}
          maxLength={80}
          onChange={(e) => setCaption(e.target.value)}
          onBlur={() => setCaptionTouched(true)}
          placeholder={CAPTION_PLACEHOLDERS[phIdx]}
        />
        {captionErr && <p className="field-err">{captionErr}</p>}
      </div>

      {err && <p className="err">{err}</p>}
      <div style={{ flex: 1 }} />
      <button
        className={`btn btn-volt ${!ready ? 'btn--locked' : ''}`}
        aria-disabled={!ready || busy}
        disabled={busy}
        onClick={next}
      >
        {busy ? 'working...' : editing ? 'save' : 'next'}
      </button>
    </div>
  )
}
