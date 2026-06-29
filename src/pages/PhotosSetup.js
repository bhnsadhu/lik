import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import StepIndicator from '../components/StepIndicator';

export default function PhotosSetup() {
  const { user, refreshProfile, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = location.state?.editMode === true;
  const returnToProfile = location.state?.returnTo === '/profile';

  const [photos, setPhotos] = useState(profile?.photos || []);
  const [coverIdx, setCoverIdx] = useState(profile?.photos?.length ? 0 : null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handlePhotoSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const remaining = 10 - photos.length;
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
        setError('upload failed · try again');
        setUploading(false);
        return;
      }
      const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(path);
      uploaded.push(publicUrl);
    }
    const isFirst = photos.length === 0;
    setPhotos(prev => [...prev, ...uploaded]);
    if (isFirst && uploaded.length > 0) {
      setCoverIdx(0);
    }
    setUploading(false);
    e.target.value = '';
  };

  const removePhoto = (i) => {
    const next = photos.filter((_, idx) => idx !== i);
    setPhotos(next);
    setCoverIdx(ci => {
      if (ci === null) return null;
      if (ci === i) return next.length > 0 ? 0 : null;
      return ci > i ? ci - 1 : ci;
    });
  };

  const canContinue = photos.length >= 5;

  const statusText = photos.length === 0
    ? 'add at least 5 photos to continue'
    : photos.length < 5
      ? `add ${5 - photos.length} more photo${5 - photos.length === 1 ? '' : 's'} to continue`
      : `${photos.length} of 10 photos`;

  const handleContinue = async () => {
    if (!canContinue || saving || uploading) return;
    setSaving(true);
    await supabase.from('profiles').update({
      photos,
      cover_photo_url: coverIdx !== null ? photos[coverIdx] : photos[0] || null,
      updated_at: new Date().toISOString(),
      ...(isEditMode || returnToProfile ? {} : { onboarding_step: 'basics' }),
    }).eq('id', user.id);
    await refreshProfile();
    if (returnToProfile || isEditMode) {
      navigate('/profile');
    }
    // else: router handles step='basics' → /setup/basics
  };

  const coverUrl = coverIdx !== null ? photos[coverIdx] : null;

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 18px 10px' }}>
        <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '18px', color: '#fff' }}>lik</span>
      </div>

      {/* Step indicator */}
      {!isEditMode && !returnToProfile && <StepIndicator currentStep={1} />}

      {/* Title */}
      <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '22px', color: '#fff', padding: '2px 18px 4px', margin: 0 }}>show yourself</p>
      <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '11px', fontWeight: 300, color: 'rgba(255,255,255,0.3)', padding: '0 18px 12px', margin: 0 }}>add at least 5 photos</p>

      {/* Cover preview */}
      <div style={{ margin: '0 18px', height: '180px', borderRadius: '10px', background: '#0d1820', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {coverUrl ? (
          <>
            <img src={coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <span style={{ position: 'absolute', top: '8px', left: '8px', background: '#3DDCFF', color: '#0A0E12', fontFamily: "'Outfit', sans-serif", fontSize: '8px', fontWeight: 600, padding: '2px 7px', borderRadius: '4px' }}>cover</span>
          </>
        ) : (
          <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '11px', fontWeight: 300, color: 'rgba(255,255,255,0.18)' }}>tap a photo to set as cover</span>
        )}
      </div>

      {/* Hint */}
      <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '10px', fontWeight: 300, color: 'rgba(255,255,255,0.22)', textAlign: 'center', padding: '8px 18px', margin: 0 }}>tap to set as cover</p>

      {/* Photo strip */}
      <div style={{ display: 'flex', gap: '6px', padding: '0 18px 4px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {photos.map((url, i) => (
          <div
            key={url + i}
            onClick={() => setCoverIdx(i)}
            style={{
              position: 'relative',
              width: '62px',
              height: '62px',
              borderRadius: '8px',
              overflow: 'hidden',
              flexShrink: 0,
              cursor: 'pointer',
              outline: i === coverIdx ? '2px solid #3DDCFF' : '2px solid transparent',
              outlineOffset: '1px',
            }}
          >
            <img
              src={url}
              alt=""
              draggable={false}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }}
            />
            <span style={{ position: 'absolute', top: '2px', left: '2px', width: '13px', height: '13px', borderRadius: '50%', background: '#3DDCFF', color: '#0A0E12', fontFamily: "'Outfit', sans-serif", fontSize: '7px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>{i + 1}</span>
            <button
              onClick={e => { e.stopPropagation(); removePhoto(i); }}
              style={{ position: 'absolute', top: '2px', right: '2px', width: '13px', height: '13px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', fontFamily: "'Outfit', sans-serif", fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, lineHeight: 1 }}
            >×</button>
          </div>
        ))}
        {photos.length < 10 && (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            style={{ width: '62px', height: '62px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.2)', fontSize: '18px', cursor: uploading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: "'Outfit', sans-serif" }}
          >{uploading ? '·' : '+'}</button>
        )}
      </div>

      {/* Status */}
      <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '10px', fontWeight: 300, color: 'rgba(255,255,255,0.28)', textAlign: 'center', padding: '8px 18px 4px', margin: 0 }}>{statusText}</p>

      {error && (
        <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '11px', fontWeight: 300, color: '#FF6B6B', textAlign: 'center', margin: '4px 0 0 0' }}>{error}</p>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handlePhotoSelect}
      />

      {/* Bottom bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 18px 20px' }}>
        <button
          onClick={handleContinue}
          disabled={!canContinue || saving || uploading}
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: '12px',
            fontWeight: 600,
            borderRadius: '20px',
            padding: '9px 20px',
            border: 'none',
            cursor: canContinue && !saving && !uploading ? 'pointer' : 'not-allowed',
            background: canContinue ? '#3DDCFF' : 'rgba(61,220,255,0.15)',
            color: canContinue ? '#0A0E12' : 'rgba(61,220,255,0.35)',
            pointerEvents: canContinue ? 'auto' : 'none',
          }}
        >
          {saving ? 'saving...' : 'next →'}
        </button>
      </div>
    </div>
  );
}
