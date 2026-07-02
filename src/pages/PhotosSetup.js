import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import StepIndicator from '../components/StepIndicator';
import useRotatingPlaceholder from '../hooks/useRotatingPlaceholder';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp'];
const MAX_BYTES = 10 * 1024 * 1024;
const UPLOAD_TIMEOUT_MS = 15000;

const CAPTION_EXAMPLES = [
  'these are my people',
  'campus life, mostly',
  'main character energy',
  'just vibing through college',
];

function compressImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 1600;
      let w = img.width, h = img.height;
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
        else { w = Math.round(w * MAX / h); h = MAX; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      canvas.toBlob(blob => resolve(blob || file), 'image/jpeg', 0.82);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

export default function PhotosSetup() {
  const { user, refreshProfile, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = location.state?.editMode === true;
  const returnToProfile = location.state?.returnTo === '/profile';

  const [photos, setPhotos] = useState(profile?.photos || []);
  const [caption, setCaption] = useState(profile?.photo_caption || '');
  const [viewIdx, setViewIdx] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const captionPlaceholder = useRotatingPlaceholder(CAPTION_EXAMPLES);

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
    e.target.value = '';

    if (file.size > MAX_BYTES) {
      setError('photo too large · max 10mb');
      return;
    }
    if (file.type && !ACCEPTED_TYPES.includes(file.type)) {
      setError('unsupported format · use jpg, png, or heic');
      return;
    }

    setUploading(true);
    setError('');
    try {
      const blob = await compressImage(file);
      const path = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
      const { error: uploadErr } = await Promise.race([
        supabase.storage.from('photos').upload(path, blob, { upsert: false, contentType: 'image/jpeg' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), UPLOAD_TIMEOUT_MS)),
      ]);
      if (uploadErr) {
        setError('upload failed · try again');
        return;
      }
      const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(path);
      const next = [...photosRef.current, publicUrl];
      updatePhotos(next);
      updateViewIdx(next.length - 1);
    } catch {
      setError('upload failed · try again');
    } finally {
      setUploading(false);
    }
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
    try {
      await supabase.from('profiles').update({
        photos,
        photo_caption: caption.trim() || null,
        cover_photo_url: photos[0] || null,
        updated_at: new Date().toISOString(),
        ...(isEditMode || returnToProfile ? {} : { onboarding_step: 'basics' }),
      }).eq('id', user.id);
      if (returnToProfile || isEditMode) {
        await refreshProfile();
        navigate('/profile');
      } else {
        navigate('/setup/basics');
      }
    } catch {
      setError('save failed · try again');
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 18px 8px' }}>
        <span style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: '18px', color: 'var(--ink)' }}>lik</span>
      </div>

      <StepIndicator currentStep={1} onStepClick={(route) => {
        if (returnToProfile) navigate(route, { state: { returnTo: '/profile' } });
        else navigate(route);
      }} />

      {/* Title + subhead */}
      <p style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: '20px', color: 'var(--ink)', padding: '2px 18px 4px', margin: 0 }}>show yourself</p>
      <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '11px', fontWeight: 300, color: 'var(--muted)', padding: '0 18px 12px', margin: 0 }}>add at least 5 photos</p>

      {/* Photo viewer — full width, no side margins */}
      <div
        style={{
          height: 'calc(100vh - 280px)',
          borderRadius: '12px',
          overflow: 'hidden',
          position: 'relative',
          background: '#ffffff',
          border: '1px solid var(--cream-2)',
          userSelect: 'none',
        }}
        onTouchStart={photos.length > 0 ? handleTouchStart : undefined}
        onTouchEnd={photos.length > 0 ? handleTouchEnd : undefined}
      >
        {photos.length === 0 ? (
          /* Empty state — file input overlaid over entire area */
          <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            {uploading ? (
              <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '11px', fontWeight: 300, color: 'var(--muted)' }}>uploading...</span>
            ) : (
              <>
                <span style={{ color: 'var(--muted)', fontSize: '40px', fontWeight: 300, lineHeight: 1 }}>+</span>
                <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '11px', fontWeight: 300, color: 'var(--muted)' }}>tap to add a photo</span>
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
            <span style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(28,10,46,0.55)', color: 'rgba(255,255,255,0.85)', fontFamily: "'Outfit', sans-serif", fontSize: '10px', fontWeight: 300, padding: '3px 8px', borderRadius: '10px', pointerEvents: 'none' }}>
              {viewIdx + 1} of {photos.length}
            </span>
            {/* × remove */}
            <button
              onTouchStart={e => e.stopPropagation()}
              onTouchEnd={e => { e.stopPropagation(); removeCurrentPhoto(); }}
              onClick={removeCurrentPhoto}
              style={{ position: 'absolute', top: '10px', right: '10px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(28,10,46,0.55)', color: 'white', border: 'none', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, lineHeight: 1 }}
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
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(28,10,46,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.85)', fontSize: '16px' }}>+</div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileAdd}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                />
              </div>
            )}
            {photos.length < 10 && uploading && (
              <div style={{ position: 'absolute', bottom: '10px', right: '10px', width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(28,10,46,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '16px' }}>·</div>
            )}
          </>
        )}
      </div>

      {/* Caption */}
      <div style={{ padding: '10px 18px 0' }}>
        <input
          type="text"
          value={caption}
          onChange={e => setCaption(e.target.value.slice(0, 80))}
          placeholder={captionPlaceholder}
          maxLength={80}
          style={{
            width: '100%', background: '#ffffff', border: '1px solid var(--cream-2)', borderRadius: '14px',
            outline: 'none', padding: '14px 16px', fontSize: '12px', color: 'var(--ink)',
            fontFamily: "'Outfit', sans-serif", fontWeight: 300, boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Hint */}
      {hintText
        ? <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '10px', fontWeight: 300, color: 'var(--muted)', textAlign: 'center', padding: '6px 18px', margin: 0 }}>{hintText}</p>
        : <div style={{ height: '6px' }} />
      }

      {/* Status */}
      <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '10px', fontWeight: 300, color: 'var(--muted)', textAlign: 'center', padding: '2px 18px 4px', margin: 0 }}>{statusText}</p>

      {error && (
        <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '11px', fontWeight: 300, color: 'var(--danger)', textAlign: 'center', margin: '4px 0 0 0' }}>{error}</p>
      )}

      {/* Bottom bar */}
      <div style={{ position: 'sticky', bottom: 0, background: 'var(--cream)', padding: '12px 18px 28px', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleContinue}
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: '12px',
            fontWeight: 600,
            borderRadius: '14px',
            padding: '14px 22px',
            border: 'none',
            cursor: canContinue && !saving ? 'pointer' : 'default',
            background: canContinue ? 'var(--teal)' : 'rgba(0,201,177,0.15)',
            color: canContinue ? '#023d35' : 'rgba(2,61,53,0.35)',
            pointerEvents: canContinue && !saving ? 'auto' : 'none',
          }}
        >
          {saving ? 'saving...' : 'next →'}
        </button>
      </div>
    </div>
  );
}
