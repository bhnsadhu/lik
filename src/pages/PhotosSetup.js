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
  const [viewIdx, setViewIdx] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Refs so handlers always see current values
  const photosRef = useRef(photos);
  const viewIdxRef = useRef(0);

  const updatePhotos = (next) => {
    const val = typeof next === 'function' ? next(photosRef.current) : next;
    photosRef.current = val;
    setPhotos(val);
  };

  const updateViewIdx = (next) => {
    const val = typeof next === 'function' ? next(viewIdxRef.current) : next;
    viewIdxRef.current = val;
    setViewIdx(val);
  };

  const handleFileAdd = async (e) => {
    const file = e.target.files[0];
    if (!file || photosRef.current.length >= 10) return;
    setUploading(true);
    setError('');
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
    const next = [...photosRef.current, publicUrl];
    updatePhotos(next);
    updateViewIdx(next.length - 1);
    setUploading(false);
    e.target.value = '';
  };

  const removeCurrentPhoto = () => {
    const i = viewIdxRef.current;
    const next = photosRef.current.filter((_, idx) => idx !== i);
    updatePhotos(next);
    updateViewIdx(Math.max(0, Math.min(i, next.length - 1)));
  };

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (!touchStart) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        updateViewIdx(prev => Math.min(prev + 1, photosRef.current.length - 1));
      } else {
        updateViewIdx(prev => Math.max(prev - 1, 0));
      }
    }
    setTouchStart(null);
  };

  const canContinue = photos.length >= 5;

  const hintText = photos.length === 0 ? '' :
    photos.length === 1 ? 'add more photos · swipe to browse' :
    'swipe to browse · hold to reorder';

  const statusText = photos.length === 0
    ? 'add 5 photos to continue'
    : photos.length < 5
      ? `add ${5 - photos.length} more to continue`
      : `${photos.length} of 10 photos`;

  const handleContinue = async () => {
    if (!canContinue || saving || uploading) return;
    setSaving(true);
    await supabase.from('profiles').update({
      photos,
      cover_photo_url: photos[0] || null,
      updated_at: new Date().toISOString(),
      ...(isEditMode || returnToProfile ? {} : { onboarding_step: 'basics' }),
    }).eq('id', user.id);
    await refreshProfile();
    if (returnToProfile || isEditMode) navigate('/profile');
    // else: router handles step='basics' → /setup/basics
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0A0E12' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 8px' }}>
        <span style={{ width: '24px' }} />
        <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '18px', color: '#fff' }}>lik</span>
        <span style={{ width: '24px' }} />
      </div>

      {!isEditMode && !returnToProfile && <StepIndicator currentStep={1} />}

      {/* Title + subhead */}
      <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '22px', color: '#fff', padding: '2px 18px 4px', margin: 0 }}>show yourself</p>
      <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '11px', fontWeight: 300, color: 'rgba(255,255,255,0.3)', padding: '0 18px 12px', margin: 0 }}>add at least 5 photos</p>

      {/* Photo viewer — full width, no side margins */}
      <div
        style={{
          height: 'calc(100vh - 280px)',
          borderRadius: '12px',
          overflow: 'hidden',
          position: 'relative',
          background: '#0d1820',
          userSelect: 'none',
        }}
        onTouchStart={photos.length > 0 ? handleTouchStart : undefined}
        onTouchEnd={photos.length > 0 ? handleTouchEnd : undefined}
      >
        {photos.length === 0 ? (
          /* Empty state — file input overlaid over entire area */
          <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            {uploading ? (
              <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '11px', fontWeight: 300, color: 'rgba(255,255,255,0.3)' }}>uploading...</span>
            ) : (
              <>
                <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '40px', fontWeight: 300, lineHeight: 1 }}>+</span>
                <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '11px', fontWeight: 300, color: 'rgba(255,255,255,0.18)' }}>tap to add a photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileAdd}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                />
              </>
            )}
          </div>
        ) : (
          <>
            <img
              src={photos[viewIdx]}
              alt=""
              draggable={false}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }}
            />
            {/* X of Y counter */}
            <span style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(0,0,0,0.45)', color: 'rgba(255,255,255,0.7)', fontFamily: "'Outfit', sans-serif", fontSize: '10px', fontWeight: 300, padding: '3px 8px', borderRadius: '10px', pointerEvents: 'none' }}>
              {viewIdx + 1} of {photos.length}
            </span>
            {/* × remove */}
            <button
              onTouchStart={e => e.stopPropagation()}
              onTouchEnd={e => { e.stopPropagation(); removeCurrentPhoto(); }}
              onClick={removeCurrentPhoto}
              style={{ position: 'absolute', top: '10px', right: '10px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, lineHeight: 1 }}
            >×</button>
            {/* Dot indicators */}
            <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '5px', alignItems: 'center', pointerEvents: 'none' }}>
              {photos.map((_, i) => (
                <span key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: i === viewIdx ? 'white' : 'rgba(255,255,255,0.3)', display: 'block', flexShrink: 0 }} />
              ))}
            </div>
            {/* + add more — file input overlaid over button visual */}
            {photos.length < 10 && !uploading && (
              <div
                style={{ position: 'absolute', bottom: '10px', right: '10px', width: '28px', height: '28px' }}
                onTouchStart={e => e.stopPropagation()}
                onTouchEnd={e => e.stopPropagation()}
              >
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '16px' }}>+</div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileAdd}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                />
              </div>
            )}
            {photos.length < 10 && uploading && (
              <div style={{ position: 'absolute', bottom: '10px', right: '10px', width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '16px' }}>·</div>
            )}
          </>
        )}
      </div>

      {/* Hint */}
      {hintText
        ? <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '10px', fontWeight: 300, color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: '6px 18px', margin: 0 }}>{hintText}</p>
        : <div style={{ height: '6px' }} />
      }

      {/* Status */}
      <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '10px', fontWeight: 300, color: 'rgba(255,255,255,0.25)', textAlign: 'center', padding: '2px 18px 4px', margin: 0 }}>{statusText}</p>

      {error && (
        <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '11px', fontWeight: 300, color: '#FF6B6B', textAlign: 'center', margin: '4px 0 0 0' }}>{error}</p>
      )}

      {/* Bottom bar */}
      <div style={{ position: 'sticky', bottom: 0, background: '#0A0E12', padding: '12px 18px 28px', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleContinue}
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: '12px',
            fontWeight: 600,
            borderRadius: '20px',
            padding: '9px 20px',
            border: 'none',
            cursor: canContinue && !saving ? 'pointer' : 'default',
            background: canContinue ? '#3DDCFF' : 'rgba(61,220,255,0.12)',
            color: canContinue ? '#0A0E12' : 'rgba(61,220,255,0.3)',
            pointerEvents: canContinue && !saving ? 'auto' : 'none',
          }}
        >
          {saving ? 'saving...' : 'next →'}
        </button>
      </div>
    </div>
  );
}
