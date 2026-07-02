import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const YEARS = ['freshman', 'sophomore', 'junior', 'senior', 'grad'];

export default function ProfileSetup() {
  const { user, refreshProfile, profile } = useAuth();
  const navigate = useNavigate();
  const isEditMode = profile?.onboarding_step === 'done';
  const [name, setName] = useState(profile?.name || '');
  const [age, setAge] = useState(profile?.age ? String(profile.age) : '');
  const [year, setYear] = useState(profile?.year || '');
  const [photos, setPhotos] = useState(profile?.photos || []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handlePhotoSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const remaining = 6 - photos.length;
    const toUpload = files.slice(0, remaining);

    setUploading(true);
    setError('');
    const uploaded = [];

    for (const file of toUpload) {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from('photos')
        .upload(path, file, { upsert: false });

      if (uploadErr) {
        setError('photo upload failed · try again');
        setUploading(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(path);

      uploaded.push(publicUrl);
    }

    setPhotos((prev) => [...prev, ...uploaded]);
    setUploading(false);
    e.target.value = '';
  };

  const removePhoto = (i) => setPhotos((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) { setError('add your name'); return; }
    const ageNum = parseInt(age, 10);
    if (!age || ageNum < 17 || ageNum > 35) { setError('age must be between 17 and 35'); return; }
    if (!year) { setError('pick your year'); return; }
    if (photos.length < 3) { setError('add at least 3 photos'); return; }

    setSaving(true);
    const { error: err } = await supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,
          email: user.email,
          name: name.trim(),
          age: ageNum,
          year,
          photos,
          onboarding_step: isEditMode ? 'done' : 'quiz',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    if (err) {
      const msg =
        err.message?.toLowerCase().includes('fetch') || err.message?.toLowerCase().includes('network')
          ? "couldn't reach the server · check your connection"
          : err.status >= 500
          ? 'server hiccup · try again in a moment'
          : 'profile save failed · try again';
      setError(msg);
      setSaving(false);
      return;
    }

    await refreshProfile();
    if (isEditMode) {
      navigate('/profile');
      return;
    }
  };

  return (
    <div className="setup-page">
      <div className="setup-inner">
        <div className="setup-header">
          <span className="wordmark-sm">lik</span>
          {!isEditMode && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--teal-dark)', opacity: 0.8, letterSpacing: '0.05em' }}>
                step 1 of 3
              </span>
              <div className="step-dots">
                <span className="dot active" />
                <span className="dot" />
                <span className="dot" />
              </div>
            </div>
          )}
        </div>

        <h2 className="setup-title">first, the basics</h2>
        <p className="setup-sub">let's build your profile</p>

        <form onSubmit={handleSubmit} className="setup-form">
          <div className="field-group">
            <label className="label">name</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="what do people call you?"
              maxLength={50}
            />
          </div>

          <div className="field-row">
            <div className="field-group half">
              <label className="label">age</label>
              <input
                className="input"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="19"
                min={17}
                max={35}
              />
            </div>
            <div className="field-group half">
              <label className="label">year</label>
              <select
                className="input select"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              >
                <option value="">select</option>
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="field-group">
            <label className="label">
              photos <span className="muted" style={{ textTransform: 'none', letterSpacing: 0 }}>· at least 3</span>
            </label>
            <div className="photo-grid">
              {photos.map((url, i) => (
                <div key={url} className="photo-slot">
                  <img src={url} alt="" />
                  <button
                    type="button"
                    className="photo-remove"
                    onClick={() => removePhoto(i)}
                  >
                    ×
                  </button>
                </div>
              ))}
              {/* Always show at least 3 empty slots; once all 3 are filled show one more (up to 6 total) */}
              {Array.from({ length: Math.min(6 - photos.length, Math.max(1, 3 - photos.length)) }).map((_, i) => (
                <button
                  key={`empty-${i}`}
                  type="button"
                  className="photo-slot add"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading && i === 0 ? '·' : '+'}
                </button>
              ))}
            </div>
            <p className="hint">photos help people connect with you</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              multiple
              style={{ display: 'none' }}
              onChange={handlePhotoSelect}
            />
          </div>

          {error && <p className="error-text">{error}</p>}

          <button
            type="submit"
            className="btn-primary"
            disabled={saving || uploading}
          >
            {saving ? 'saving...' : isEditMode ? 'save changes' : 'continue →'}
          </button>
        </form>
      </div>
    </div>
  );
}
