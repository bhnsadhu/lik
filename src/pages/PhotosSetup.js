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
        setError('upload failed — try again');
        setUploading(false);
        return;
      }
      const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(path);
      uploaded.push(publicUrl);
    }
    setPhotos(prev => [...prev, ...uploaded]);
    setUploading(false);
    e.target.value = '';
  };

  const removePhoto = (i) => setPhotos(prev => prev.filter((_, idx) => idx !== i));

  const handleContinue = async () => {
    if (photos.length < 3 || saving || uploading) return;
    setSaving(true);
    await supabase.from('profiles').update({
      photos,
      updated_at: new Date().toISOString(),
      ...(returnToProfile ? {} : { onboarding_step: 'basics' }),
    }).eq('id', user.id);
    await refreshProfile();
    if (returnToProfile) {
      navigate('/profile');
    } else if (isEditMode) {
      navigate('/setup/basics', { state: { editMode: true } });
    }
    // else: router handles step='basics' → /setup/basics
  };

  return (
    <div className="setup-page">
      <div className="setup-inner">
        <div className="setup-header">
          <span className="wordmark-sm">lik</span>
          {!isEditMode && !returnToProfile && (
            <span className="setup-step-label">step 1 of 5</span>
          )}
        </div>

        <h2 className="setup-title">show yourself</h2>
        <p className="setup-sub">add at least 3 photos</p>

        <div className="photos-grid-2col">
          {Array.from({ length: 6 }).map((_, i) => {
            const photo = photos[i];
            return (
              <div key={i} className="photo-slot-2col">
                {photo ? (
                  <>
                    <img src={photo} alt="" />
                    <button className="photo-remove-2col" onClick={() => removePhoto(i)}>×</button>
                    {i === 0 && <span className="photo-main-badge">main</span>}
                  </>
                ) : (
                  <button
                    className="photo-add-2col"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                  >
                    <span className="photo-add-icon-2col">{uploading ? '·' : '+'}</span>
                    {i >= 3 && <span className="photo-optional-label">optional</span>}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {error && <p className="error-text" style={{ marginTop: 12 }}>{error}</p>}

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          multiple
          style={{ display: 'none' }}
          onChange={handlePhotoSelect}
        />

        <div style={{ marginTop: 28 }}>
          <button
            className="btn-primary"
            onClick={handleContinue}
            disabled={photos.length < 3 || saving || uploading}
          >
            {saving ? 'saving...' : 'continue →'}
          </button>
        </div>
      </div>
    </div>
  );
}
