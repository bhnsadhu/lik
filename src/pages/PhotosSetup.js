import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function PhotosSetup() {
  const { user, refreshProfile, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = location.state?.editMode === true;
  const returnToProfile = location.state?.returnTo === '/profile';

  const [photos, setPhotos] = useState(profile?.photos || []);
  const [coverIdx, setCoverIdx] = useState(profile?.photos?.length ? 0 : null);
  const [profilePicIdx, setProfilePicIdx] = useState(profile?.photos?.length ? 0 : null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();
  const longPressTimer = useRef(null);
  const longPressActivated = useRef(false);

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
      setProfilePicIdx(0);
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
    setProfilePicIdx(pi => {
      if (pi === null) return null;
      if (pi === i) return next.length > 0 ? 0 : null;
      return pi > i ? pi - 1 : pi;
    });
  };

  const startLongPress = (i) => {
    longPressActivated.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressActivated.current = true;
      setProfilePicIdx(i);
    }, 500);
  };

  const endPress = (i) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (!longPressActivated.current) {
      setCoverIdx(i);
    }
    longPressActivated.current = false;
  };

  const cancelPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    longPressActivated.current = false;
  };

  const canContinue = photos.length >= 5 && profilePicIdx !== null;

  const statusText = photos.length < 5
    ? 'add at least 5 photos to continue'
    : profilePicIdx === null
      ? 'now hold a photo to set your profile pic'
      : `${photos.length} of 10 photos added`;

  const handleContinue = async () => {
    if (!canContinue || saving || uploading) return;
    setSaving(true);
    await supabase.from('profiles').update({
      photos,
      cover_photo_url: photos[coverIdx],
      profile_pic_url: photos[profilePicIdx],
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
  const picUrl = profilePicIdx !== null ? photos[profilePicIdx] : null;

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '88px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '28px 16px 20px' }}>
        <span className="wordmark-sm">lik</span>
        {!isEditMode && !returnToProfile && (
          <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '10px', fontWeight: 300, color: 'rgba(255,255,255,0.3)' }}>step 1 of 5</span>
        )}
      </div>

      {/* Preview row */}
      <div style={{ display: 'flex', gap: '10px', margin: '0 16px' }}>
        {/* Cover photo */}
        <div style={{ flex: '0 0 calc(58% - 5px)' }}>
          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '9px', fontWeight: 300, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px 0' }}>cover photo</p>
          <div style={{ height: '160px', borderRadius: '10px', background: '#0d1820', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {coverUrl ? (
              <img src={coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            ) : (
              <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '10px', fontWeight: 300, color: 'rgba(255,255,255,0.2)' }}>tap below to set</span>
            )}
          </div>
        </div>

        {/* Profile pic */}
        <div style={{ flex: '0 0 calc(38% - 5px)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '9px', fontWeight: 300, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px 0', alignSelf: 'flex-start' }}>profile pic</p>
          <div style={{ width: '100%', aspectRatio: '1', borderRadius: '50%', background: '#0d1820', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {picUrl ? (
              <img src={picUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            ) : (
              <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '20px', fontWeight: 300, color: 'rgba(255,255,255,0.2)', lineHeight: 1 }}>+</span>
            )}
          </div>
          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '9px', fontWeight: 300, color: 'rgba(255,255,255,0.2)', textAlign: 'center', margin: '6px 0 0 0' }}>shown in chats</p>
        </div>
      </div>

      {/* Hint */}
      <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '10px', fontWeight: 300, color: 'rgba(255,255,255,0.25)', textAlign: 'center', margin: '14px 0 0 0' }}>tap to set cover · hold to set profile pic</p>

      {/* Photo strip */}
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginTop: '16px' }}>
        <div style={{ display: 'flex', gap: '6px', padding: '4px 16px 8px', width: 'max-content' }}>
          {photos.map((url, i) => (
            <div
              key={url + i}
              style={{
                position: 'relative',
                width: '70px',
                height: '70px',
                borderRadius: '8px',
                overflow: 'hidden',
                flexShrink: 0,
                cursor: 'pointer',
                outline: i === coverIdx ? '2px solid #3DDCFF' : '2px solid transparent',
                boxSizing: 'border-box',
                userSelect: 'none',
              }}
              onPointerDown={() => startLongPress(i)}
              onPointerUp={() => endPress(i)}
              onPointerLeave={cancelPress}
            >
              <img
                src={url}
                alt=""
                draggable={false}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none', userSelect: 'none' }}
              />
              {/* Order badge */}
              <span style={{ position: 'absolute', top: '3px', left: '3px', width: '14px', height: '14px', borderRadius: '50%', background: '#3DDCFF', color: '#0A0E12', fontFamily: "'Outfit', sans-serif", fontSize: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, pointerEvents: 'none' }}>{i + 1}</span>
              {/* Remove button */}
              <button
                onPointerDown={e => e.stopPropagation()}
                onClick={e => { e.stopPropagation(); removePhoto(i); }}
                style={{ position: 'absolute', top: '3px', right: '3px', width: '14px', height: '14px', borderRadius: '50%', background: 'rgba(0,0,0,0.65)', color: 'white', border: 'none', fontFamily: "'Outfit', sans-serif", fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, lineHeight: 1 }}
              >×</button>
              {/* Profile pic indicator dot */}
              {i === profilePicIdx && (
                <span style={{ position: 'absolute', bottom: '3px', left: '3px', width: '10px', height: '10px', borderRadius: '50%', background: 'white', border: '1.5px solid rgba(0,0,0,0.35)', display: 'block', pointerEvents: 'none' }} />
              )}
            </div>
          ))}
          {/* Add slot */}
          {photos.length < 10 && (
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              style={{ width: '70px', height: '70px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.2)', fontSize: '20px', cursor: uploading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: "'Outfit', sans-serif" }}
            >{uploading ? '·' : '+'}</button>
          )}
        </div>
      </div>

      {/* Status text */}
      <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '11px', fontWeight: 300, color: 'rgba(255,255,255,0.3)', textAlign: 'center', margin: '8px 0 0 0' }}>{statusText}</p>

      {error && (
        <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '11px', fontWeight: 300, color: '#FF6B6B', textAlign: 'center', margin: '6px 0 0 0' }}>{error}</p>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handlePhotoSelect}
      />

      {/* Fixed bottom bar */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 18px 24px', display: 'flex', justifyContent: 'flex-end', background: 'linear-gradient(to top, #0A0E12 60%, transparent)' }}>
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
          }}
        >
          {saving ? 'saving...' : 'next →'}
        </button>
      </div>
    </div>
  );
}
